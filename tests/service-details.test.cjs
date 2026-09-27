const fs = require('node:fs');
const assert = require('node:assert/strict');
const { test } = require('node:test');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');
for (const extension of ['.ts', '.tsx']) {
  require.extensions[extension] = (module, filename) => {
    const { outputText } = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
    });
    module._compile(outputText, filename);
  };
}
require.extensions['.css'] = () => {};
const { ServiceDetails } = require('../src/ServiceDetails.tsx');
const { guides, documentsFor, requestStages } = require('../src/serviceGuides.ts');
const { I18nProvider, messages } = require('../src/i18n.tsx');
const { beirutNow, futureAppointment, parseCases } = require('../src/cases.ts');
const { validateRegistration, validateIdentityFile } = require('../src/registrationValidation.ts');
const { passportRequirements, validPassportAnswers } = require('../src/features/services/passportRequirements.ts');
const client = require('../src/services/client.ts');

test('mock appointments validate branches, unavailable slots, and service identity', async () => {
  assert.deepEqual(await client.getSlots('not-a-branch', '2099-10-02'), []);
  assert.deepEqual(await client.getSlots('demo-beirut', '2020-01-01'), []);
  assert.deepEqual(await client.getSlots('demo-beirut', '2099-10-04'), []);
  await assert.rejects(client.bookAppointment('not-a-service', 'demo-beirut', '2099-10-02', '09:00'));
  await assert.rejects(client.bookAppointment('police', 'demo-beirut', '2099-10-02', '23:00'));
  const appointment = await client.bookAppointment('police', 'demo-beirut', '2099-10-02', '09:00');
  assert.equal(appointment.mode, 'demo');
  assert.match(appointment.reference, /^DEMO-/);
  await assert.rejects(client.getServiceById('missing', 'en'));
});

test('notification preferences suppress alerts and preserve read state', () => {
  const record = { id:'notifications', serviceId:'police', created:'2026-09-13', due:'', stage:'Preparing documents', documents:[], expiresOn:'2020-01-01', updatedAt:'2026-09-25T12:00:00Z' };
  const preferences = { ...client.defaultPreferences, readNotifications: ['notifications:incomplete'] };
  const notifications = client.getNotifications([record], preferences);
  assert.equal(notifications.find(n => n.title === 'incompleteNotice').read, true);
  assert.ok(notifications.some(n => n.title === 'expiryNotice'));
  assert.ok(notifications.some(n => n.title === 'updated'));
  assert.deepEqual(client.getNotifications([record], { ...preferences, expiryAlerts:false, updateAlerts:false, incompleteAlerts:false }), []);
  assert.ok(!client.getNotifications([{ ...record, stage:'Completed' }], preferences).some(n => n.title === 'incompleteNotice'));
});

test('extended case migration keeps valid demo metadata and removes unrecognized fields', () => {
  const record = { id:'extended', serviceId:'driving', created:'2026-09-13', stage:'Processing', due:'', expiresOn:'2099-10-02', updatedAt:'2026-09-25T12:00:00Z', appointment:{date:'2099-10-02',time:'09:00',mode:'demo',branchId:'demo-beirut',reference:'DEMO-12345678',secret:'private'} };
  const parsed = parseCases(JSON.stringify([record]))[0];
  assert.equal(parsed.stage, 'Processing');
  assert.equal(parsed.appointment.branchId, 'demo-beirut');
  assert.equal(parsed.expiresOn, '2099-10-02');
  assert.ok(!JSON.stringify(parsed).includes('private'));
  const invalid = parseCases(JSON.stringify([{ ...record, expiresOn:'bad-date', appointment:{ ...record.appointment, branchId:'unknown' } }]))[0];
  assert.equal(invalid.expiresOn, undefined);
  assert.equal(invalid.appointment.mode, undefined);
});

test('passport personalization retains uncertain identity rules and separates exceptional replacements', () => {
  const adult = { route: 'renewal', ageBand: 'adult', hasPrevious: 'yes' };
  assert.deepEqual(passportRequirements(adult), { kind: 'renewal', excluded: ['guardian'], needsAuthority: false });
  assert.deepEqual(passportRequirements({ ...adult, ageBand: 'minor' }).excluded, []);
  assert.equal(passportRequirements({ ...adult, hasPrevious: 'no' }).needsAuthority, true);
  assert.equal(passportRequirements({ ...adult, route: 'lost' }).needsAuthority, true);
  assert.equal(passportRequirements({ ...adult, route: 'damaged' }).needsAuthority, true);
  assert.equal(passportRequirements({ ...adult, route: 'application', hasPrevious: 'no' }).needsAuthority, false);
  assert.equal(validPassportAnswers({ ...adult, ageBand: 'unknown' }), false);
  assert.equal(validPassportAnswers({ route: 'renewal' }), false);
  assert.equal(validPassportAnswers(null), false);
});

test('personalized cases preserve only validated answers without identity or exact age', () => {
  const base = { id: 'wizard-case', serviceId: 'passport', kind: 'renewal', created: '2026-09-13', due: '', notApplicable: ['guardian'] };
  const answers = { route: 'renewal', ageBand: 'adult', hasPrevious: 'yes' };
  const parsed = parseCases(JSON.stringify([{ ...base, passportAnswers: { ...answers, age: 22, idNumber: 'private' } }]));
  assert.deepEqual(parsed[0].passportAnswers, answers);
  assert.ok(!JSON.stringify(parsed).includes('private'));
  assert.deepEqual(parseCases(JSON.stringify([{ ...base, notApplicable: [], passportAnswers: answers }]))[0].notApplicable, ['guardian']);
  assert.deepEqual(parseCases(JSON.stringify([{ ...base, passportAnswers: { ...answers, ageBand: 'minor' } }]))[0].notApplicable, []);
  for (const invalid of [{ ...answers, route: 'lost' }, { ...answers, route: 'application' }, { ...answers, hasPrevious: 'no' }, { ...answers, ageBand: 'invalid' }]) {
    assert.equal(parseCases(JSON.stringify([{ ...base, passportAnswers: invalid }]))[0].passportAnswers, undefined);
  }
});
const render = (serviceId, request) => renderToStaticMarkup(React.createElement(ServiceDetails, {
  serviceId, request, onCreate() {}, onUpdate() {}, onViewCases() {},
}));

test('every service exposes documents and requirements before request creation', () => {
  for (const id of Object.keys(guides)) {
    const html = render(id);
    const actionIndex = html.indexOf('Create personal request');
    assert.ok(actionIndex > html.indexOf('Required documents'));
    assert.ok(actionIndex > html.indexOf('Eligibility &amp; requirements'));
    assert.ok(actionIndex > html.indexOf('Estimated fees'));
    assert.ok(actionIndex > html.indexOf('Where to go'));
    for (const doc of documentsFor(id, 'application')) {
      assert.ok(html.includes(doc.title.replaceAll('&', '&amp;')), `${id}: ${doc.title}`);
    }
    assert.ok(html.includes('does not send this request to the government'));
    assert.ok(!html.includes('type="checkbox"'), 'Preparation checkboxes belong to a saved request');
  }
});

test('license renewal shows existing license and excludes first-license training', () => {
  const html = render('driving', { kind: 'renewal', stage: 'Submitted', documents: ['identity'], due: '2026-10-01' });
  assert.ok(html.includes('Existing driving license'));
  assert.ok(!html.includes('Training and test documents, if applicable'));
  assert.ok(html.includes('value="2026-10-01"'));
  assert.ok(html.includes('1 of 5 documents prepared'));
  assert.ok(html.includes('selected="">Submitted'));
  assert.ok(!html.includes('Create personal request'));
});

test('legacy cases without new fields render with safe preparation defaults', () => {
  const html = render('passport', { due: '' });
  assert.ok(html.includes('0 of 5 documents prepared'));
  assert.ok(html.includes('selected="">Preparing documents'));
  for (const stage of requestStages) assert.ok(html.includes(stage));
  assert.ok(html.includes('View my cases'));
});

test('every service renders translated requirements and appointment controls in all three languages', () => {
  for (const locale of ['en', 'ar', 'fr']) for (const serviceId of Object.keys(guides)) {
    const html = renderToStaticMarkup(React.createElement(I18nProvider, { initialLocale: locale }, React.createElement(ServiceDetails, { serviceId, onCreate() {}, onUpdate() {}, onViewCases() {} })));
    assert.ok(html.includes(messages.requiredDocs[locale]));
    assert.ok(html.includes(messages.nearest[locale]));
    assert.ok(html.includes(messages.noLive[locale]));
    assert.ok(html.includes(messages.createRequest[locale]));
    assert.ok(html.includes('type="date"'));
    assert.ok(html.includes('type="time"'));
  }
});

test('appointment validation rejects impossible dates and past times using Beirut time', () => {
  const now = new Date('2026-09-13T12:00:00Z');
  assert.deepEqual(beirutNow(now), { date: '2026-09-13', time: '15:00' });
  assert.equal(futureAppointment({ date: '2026-09-13', time: '14:59' }, now), false);
  assert.equal(futureAppointment({ date: '2026-09-13', time: '15:01' }, now), true);
  assert.equal(futureAppointment({ date: '2027-02-30', time: '09:00' }, now), false);
  assert.equal(futureAppointment({ date: '2026-09-14', time: '25:00' }, now), false);
});

test('case migration preserves dates and valid progress while excluding unrelated and sensitive fields', () => {
  const [c] = parseCases(JSON.stringify([{ id: 'legacy', serviceId: 'passport', created: '2026-09-13', due: '2026-10-01', checked: [0,1], documents: ['photo', 'photo', 'invalid'], stage: 'Submitted', appointment: { date: '2026-10-02', time: '10:30' }, password: 'never-persist', idNumber: 'private' }]));
  assert.equal(c.stage, 'Submitted');
  assert.equal(c.due, '2026-10-01');
  assert.deepEqual(c.documents, ['photo']);
  assert.deepEqual(c.appointment, { date: '2026-10-02', time: '10:30' });
  assert.ok(!('password' in c));
  assert.ok(!('idNumber' in c));
  assert.deepEqual(parseCases('{broken'), []);
  assert.deepEqual(parseCases('[null,{}, {"serviceId":"__proto__","id":"x","created":"today"}]'), []);
  const [conditional] = parseCases(JSON.stringify([{ id: 'p', serviceId: 'passport', created: '2026-09-13', documents: ['guardian', 'photo'], notApplicable: ['guardian', 'identity', 'guardian'] }]));
  assert.deepEqual(conditional.notApplicable, ['guardian']);
  assert.deepEqual(conditional.documents, ['photo']);
});

test('registration requires bilingual names and credentials while identity attachments are optional', () => {
  const base = { name: 'Test Person', nameArabic: 'شخص تجريبي', dob: '1995-05-12', idNumber: 'TEST-123', email: 'test@example.com', password: 'Sample-only-1234', confirmPassword: 'Sample-only-1234', consent: true };
  const files = { idPhoto: new File(['sample'], 'sample.png'), extract: new File(['sample'], 'sample.pdf') };
  assert.deepEqual(validateRegistration(base, files), {});
  assert.deepEqual(validateRegistration({...base, idNumber:''}, {idPhoto:null, extract:null}), {});
  assert.ok(validateRegistration({...base, nameArabic:''}, files).nameArabic);
  const errors = validateRegistration({ ...base, name: ' ', dob: '2099-01-01', idNumber: ' ', confirmPassword: 'wrong', consent: false }, { idPhoto: null, extract: null });
  for (const key of ['name', 'dob', 'confirmPassword', 'consent']) assert.ok(errors[key]);
});

test('upload checks enforce size, actual file signature, and ID image-only policy', async () => {
  assert.equal(await validateIdentityFile(new File(['<svg/>'], 'id.svg', { type: 'image/svg+xml' }), false), 'fileType');
  assert.equal(await validateIdentityFile(new File(['not a png'], 'id.png', { type: 'image/png' }), false), 'fileInvalid');
  assert.equal(await validateIdentityFile(new File([], 'empty.jpg', { type: 'image/jpeg' }), false), 'fileSize');
  assert.equal(await validateIdentityFile(new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' }), false), 'fileSize');
  const pdf = new File(['%PDF-1.4\nsample'], 'sample.pdf', { type: 'application/pdf' });
  assert.equal(await validateIdentityFile(pdf, false), 'fileType');
  assert.equal(await validateIdentityFile(pdf, true), null);
});
