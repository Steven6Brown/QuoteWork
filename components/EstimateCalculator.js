'use client';

import { useState, useEffect, useMemo } from 'react';
import { DEFAULT_RATES, fmt, fmtRange, computeQuote, mergeWithDefaults, maintText } from '../lib/rates';
import { buildInvoicePDF, invoiceFilename, savePdf, deleteInvoiceFile, loadImageDataUrl } from '../lib/invoice';
import ClientProjectPanel from './ClientProjectPanel';
import ProjectScopePanel from './ProjectScopePanel';
// import RateLevelPanel from './RateLevelPanel'; // disabled — rates are now adjusted directly in "Customize your base rates"
import RateSettingsPanel from './RateSettingsPanel';
import BusinessInfoPanel from './BusinessInfoPanel';
import SavedEstimatesPanel from './SavedEstimatesPanel';
import InvoicesPanel from './InvoicesPanel';
import EstimateSheet from './EstimateSheet';

const DEFAULT_BUSINESS = { name: 'Aquila Digital', email: '', phone: '', address: '', footerNote: 'Thank you for the opportunity to work together.' };

export default function EstimateCalculator() {
  const [mounted, setMounted] = useState(false);
  const [rates, setRates] = useState(DEFAULT_RATES);
  const [savedList, setSavedList] = useState([]);
  const [activeEstimateId, setActiveEstimateId] = useState(null);

  const [clientName, setClientName] = useState('');
  const [projectName, setProjectName] = useState('');
  const [typeVal, setTypeVal] = useState('business');
  const [extraPages, setExtraPages] = useState(0);
  const [extraRevisions, setExtraRevisions] = useState(0);
  const [features, setFeatures] = useState({});
  const [addons, setAddons] = useState({});
  const [rush, setRush] = useState(false);
  const [hostingChoice, setHostingChoice] = useState(null);
  const [maintPlan, setMaintPlan] = useState('monthly');
  const [customLines, setCustomLines] = useState([]);
  const [customOnly, setCustomOnly] = useState(false);
  const [expIndex, setExpIndex] = useState(0);
  const [saveFlash, setSaveFlash] = useState(false);
  const [copyFlash, setCopyFlash] = useState(false);

  const [business, setBusiness] = useState(DEFAULT_BUSINESS);
  const [finalPrice, setFinalPrice] = useState(0);
  const [finalPriceTouched, setFinalPriceTouched] = useState(false);
  const [paymentTerms, setPaymentTerms] = useState('due_on_receipt');
  const [invoiceType, setInvoiceType] = useState('split');
  const [folderHandle, setFolderHandle] = useState(null);
  const [folderName, setFolderName] = useState('');
  const [invoiceFlash, setInvoiceFlash] = useState('');
  const [folderPickerSupported, setFolderPickerSupported] = useState(false);
  const [nextInvoiceNumber, setNextInvoiceNumber] = useState(1);
  const [nextMgtNumber, setNextMgtNumber] = useState(1);

  // Load persisted data once, client-side only
  useEffect(() => {
    setMounted(true);
    setFolderPickerSupported(typeof window !== 'undefined' && !!window.showDirectoryPicker);
    try {
      const savedRates = JSON.parse(localStorage.getItem('estimateRates'));
      if (savedRates) setRates(mergeWithDefaults(savedRates));
    } catch {}
    try {
      const list = JSON.parse(localStorage.getItem('savedEstimates')) || [];
      setSavedList(list);
    } catch {}
    try {
      const savedBusiness = JSON.parse(localStorage.getItem('businessInfo'));
      if (savedBusiness) setBusiness(savedBusiness);
    } catch {}
    try {
      const counter = parseInt(localStorage.getItem('invoiceCounter') || '0', 10);
      setNextInvoiceNumber(counter + 1);
      const mgtCounter = parseInt(localStorage.getItem('invoiceCounterMgt') || '0', 10);
      setNextMgtNumber(mgtCounter + 1);
    } catch {}
  }, []);

  useEffect(() => {
    if (mounted) localStorage.setItem('estimateRates', JSON.stringify(rates));
  }, [rates, mounted]);

  useEffect(() => {
    if (mounted) localStorage.setItem('businessInfo', JSON.stringify(business));
  }, [business, mounted]);

  const formState = { typeVal, extraPages, extraRevisions, features, addons, rush, expIndex, hostingChoice, maintPlan, customLines, customOnly };
  const { lines, low, high } = useMemo(() => computeQuote(rates, formState), [
    rates, typeVal, extraPages, extraRevisions, features, addons, rush, expIndex, hostingChoice, maintPlan, customLines, customOnly,
  ]);

  const depositLow = low * (rates.depositPct / 100);
  const depositHigh = high * (rates.depositPct / 100);
  const estimateNumber = String(savedList.length + 1).padStart(3, '0');

  useEffect(() => {
    if (!finalPriceTouched) setFinalPrice(Math.round((low + high) / 2));
  }, [low, high, finalPriceTouched]);

  const updateNextInvoiceNumber = (n) => {
    setNextInvoiceNumber(n);
    try { localStorage.setItem('invoiceCounter', String(n - 1)); } catch {}
  };

  const updateNextMgtNumber = (n) => {
    setNextMgtNumber(n);
    try { localStorage.setItem('invoiceCounterMgt', String(n - 1)); } catch {}
  };

  const chooseFolder = async () => {
    if (!folderPickerSupported) return;
    try {
      const handle = await window.showDirectoryPicker();
      setFolderHandle(handle);
      setFolderName(handle.name);
    } catch {
      // user cancelled the picker
    }
  };

  const currentFields = () => ({
    client: clientName, project: projectName, low, high,
    typeVal, extraPages, extraRevisions, expIndex, features, addons,
    rush, hostingChoice, maintPlan, finalPrice, paymentTerms,
    customLines, customOnly, invoiceType,
  });

  // Saves the current form to the active record if one exists, otherwise
  // creates a new one. Returns { id, list } so callers can chain more
  // updates (like attaching invoice info) onto the same record.
  const upsertEstimate = (extraFields = {}) => {
    let id = activeEstimateId;
    let next;
    if (id && savedList.some((e) => e.id === id)) {
      next = savedList.map((e) => (e.id === id ? { ...e, ...currentFields(), ...extraFields } : e));
    } else {
      id = Date.now();
      const entry = {
        id,
        date: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
        ...currentFields(),
        ...extraFields,
      };
      next = [...savedList, entry];
      setActiveEstimateId(id);
    }
    setSavedList(next);
    localStorage.setItem('savedEstimates', JSON.stringify(next));
    return { id, list: next };
  };

  const downloadInvoice = async () => {
    const payInFull = invoiceType === 'full';
    const invoiceNumber = payInFull ? nextMgtNumber : nextInvoiceNumber;
    const logo = await loadImageDataUrl('/aquila-logo.png');
    const doc = buildInvoicePDF({
      business, client: clientName, project: projectName, lines,
      finalPrice, depositPct: rates.depositPct, paymentTerms, invoiceNumber,
      notes: business.footerNote, logo, payInFull,
      recurring: hostingChoice === 'managed' && typeVal !== 'none' ? `Ongoing website management: ${maintText(maintPlan)}, billed separately from this invoice.` : '',
    });
    const filename = invoiceFilename({ client: clientName, project: projectName, invoiceNumber, payInFull });
    const result = await savePdf(doc, filename, folderHandle, payInFull ? 'management' : 'project');
    const advanced = invoiceNumber + 1;
    if (payInFull) {
      setNextMgtNumber(advanced);
      try { localStorage.setItem('invoiceCounterMgt', String(invoiceNumber)); } catch {}
    } else {
      setNextInvoiceNumber(advanced);
      try { localStorage.setItem('invoiceCounter', String(invoiceNumber)); } catch {}
    }

    // Attach the invoice to this estimate's record — creating the record
    // first if it hasn't been saved yet, rather than tracking invoices
    // in a separate, disconnected list.
    upsertEstimate({
      invoiceNumber, invoiceFilename: filename, invoiceSavedTo: result.savedTo,
      invoiceDate: new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }),
    });

    setInvoiceFlash(
      result.savedTo === 'configured' ? `Saved to ${result.folder}`
        : result.savedTo === 'folder' ? `Saved to ${folderName}`
        : 'Downloaded'
    );
    setTimeout(() => setInvoiceFlash(''), 2000);
  };

  const deleteInvoiceFromEstimate = async (entry) => {
    if (entry.invoiceSavedTo === 'folder' && folderHandle) {
      await deleteInvoiceFile(folderHandle, entry.invoiceFilename);
    }
    const next = savedList.map((e) =>
      e.id === entry.id
        ? { ...e, invoiceNumber: undefined, invoiceFilename: undefined, invoiceSavedTo: undefined, invoiceDate: undefined }
        : e
    );
    setSavedList(next);
    localStorage.setItem('savedEstimates', JSON.stringify(next));
  };

  // Choosing "No website package" switches to a pay-in-full invoice (nothing to
  // split into deposit and balance); picking a package switches back.
  // Either change also detaches from the estimate being edited, so the next
  // save creates a new record instead of overwriting the one of the other type.
  const changeType = (value) => {
    setTypeVal(value);
    setInvoiceType(value === 'none' ? 'full' : 'split');
    setActiveEstimateId(null);
  };

  const changeInvoiceType = (value) => {
    setInvoiceType(value);
    setActiveEstimateId(null);
  };

  const updateTypeRate = (type, field, value) =>
    setRates((prev) => ({ ...prev, types: { ...prev.types, [type]: { ...prev.types[type], [field]: +value || 0 } } }));

  const updateFeatureRate = (id, field, value) =>
    setRates((prev) => ({ ...prev, features: prev.features.map((f) => (f.id === id ? { ...f, [field]: +value || 0 } : f)) }));

  const updateAddonRate = (id, field, value) =>
    setRates((prev) => ({ ...prev, addons: prev.addons.map((a) => (a.id === id ? { ...a, [field]: +value || 0 } : a)) }));

  const updateMult = (idx, value) =>
    setRates((prev) => {
      const m = [...prev.mult];
      m[idx] = +value || 1;
      return { ...prev, mult: m };
    });

  const resetRates = () => setRates(JSON.parse(JSON.stringify(DEFAULT_RATES)));

  const toggleFeature = (id) => setFeatures((prev) => ({ ...prev, [id]: !prev[id] }));
  const toggleAddon = (id) => setAddons((prev) => ({ ...prev, [id]: !prev[id] }));

  const saveEstimate = () => {
    upsertEstimate();
    setSaveFlash(true);
    setTimeout(() => setSaveFlash(false), 1200);
  };

  const deleteEstimate = async (id) => {
    const entry = savedList.find((e) => e.id === id);
    if (entry?.invoiceSavedTo === 'folder' && folderHandle) {
      await deleteInvoiceFile(folderHandle, entry.invoiceFilename);
    }
    const next = savedList.filter((i) => i.id !== id);
    setSavedList(next);
    localStorage.setItem('savedEstimates', JSON.stringify(next));
    if (activeEstimateId === id) setActiveEstimateId(null);
  };

  const startNewEstimate = () => {
    setActiveEstimateId(null);
    setClientName('');
    setProjectName('');
    setTypeVal('business');
    setExtraPages(0);
    setExtraRevisions(0);
    setFeatures({});
    setAddons({});
    setRush(false);
    setHostingChoice(null);
    setMaintPlan('monthly');
    setCustomLines([]);
    setCustomOnly(false);
    setExpIndex(0);
    setFinalPriceTouched(false);
    setPaymentTerms('due_on_receipt');
    setInvoiceType('split');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loadEstimate = (item) => {
    setActiveEstimateId(item.id);
    setClientName(item.client || '');
    setProjectName(item.project || '');
    setTypeVal(item.typeVal || 'business');
    setExtraPages(item.extraPages || 0);
    setExtraRevisions(item.extraRevisions || 0);
    setExpIndex(item.expIndex ?? 0);
    setFeatures(item.features || {});
    setAddons(item.addons || {});
    setRush(!!item.rush);
    setHostingChoice(item.hostingChoice || null);
    setMaintPlan(item.maintPlan || 'monthly');
    setCustomLines(Array.isArray(item.customLines) ? item.customLines : []);
    setCustomOnly(!!item.customOnly);
    if (item.finalPrice) { setFinalPrice(item.finalPrice); setFinalPriceTouched(true); }
    else { setFinalPriceTouched(false); }
    setPaymentTerms(item.paymentTerms || 'due_on_receipt');
    setInvoiceType(item.invoiceType || 'split');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const copyAsText = () => {
    let text = 'WEBSITE PROJECT ESTIMATE\n';
    if (clientName) text += `Client: ${clientName}\n`;
    if (projectName) text += `Project: ${projectName}\n`;
    text += '\n';
    lines.forEach((l) => {
      text += `${l.label}: ${fmtRange(l.low, l.high)}\n`;
    });
    text += `\nTotal: ${fmtRange(low, high)}`;
    text += `\nDeposit due (${rates.depositPct}%): ${fmtRange(depositLow, depositHigh)}`;
    if (hostingChoice === 'managed' && typeVal !== 'none') text += `\nOngoing website management: ${maintText(maintPlan)} (billed separately)`;
    navigator.clipboard.writeText(text).then(() => {
      setCopyFlash(true);
      setTimeout(() => setCopyFlash(false), 1200);
    });
  };

  return (
    <div className="wrap">
      <header>
        <div>
          <p className="brand">Quotework</p>
          <p className="brand-sub">Created by Aquila Digital</p>
        </div>
        <div className="estimate-tag no-print">
          <strong>Estimate No. {estimateNumber}</strong>
          <span>{mounted ? new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : ''}</span>
          {activeEstimateId && (
            <button type="button" className="ghost small" style={{ marginTop: 6, padding: '2px 0' }} onClick={startNewEstimate}>
              + New estimate
            </button>
          )}
        </div>
      </header>

      <div className="grid">
        <div className="no-print">
          <ClientProjectPanel clientName={clientName} setClientName={setClientName} projectName={projectName} setProjectName={setProjectName} />

          <ProjectScopePanel
            rates={rates} typeVal={typeVal} setTypeVal={changeType}
            extraPages={extraPages} setExtraPages={setExtraPages}
            extraRevisions={extraRevisions} setExtraRevisions={setExtraRevisions}
            features={features} toggleFeature={toggleFeature}
            addons={addons} toggleAddon={toggleAddon}
            rush={rush} setRush={setRush}
            hostingChoice={hostingChoice} setHostingChoice={setHostingChoice}
            maintPlan={maintPlan} setMaintPlan={setMaintPlan}
            customLines={customLines} setCustomLines={setCustomLines}
            customOnly={customOnly} setCustomOnly={setCustomOnly}
          />

          {/* <RateLevelPanel expIndex={expIndex} setExpIndex={setExpIndex} /> */}

          <RateSettingsPanel
            rates={rates} setRates={setRates}
            updateTypeRate={updateTypeRate} updateFeatureRate={updateFeatureRate}
            updateAddonRate={updateAddonRate} updateMult={updateMult} resetRates={resetRates}
          />

          <BusinessInfoPanel business={business} setBusiness={setBusiness} nextInvoiceNumber={nextInvoiceNumber} setNextInvoiceNumber={updateNextInvoiceNumber} nextMgtNumber={nextMgtNumber} setNextMgtNumber={updateNextMgtNumber} />

          <SavedEstimatesPanel savedList={savedList} onLoad={loadEstimate} onDelete={deleteEstimate} activeEstimateId={activeEstimateId} />

          <InvoicesPanel invoices={savedList.filter((e) => e.invoiceNumber)} onDelete={deleteInvoiceFromEstimate} folderConnected={!!folderHandle} />
        </div>

        <div>
          <EstimateSheet
            clientName={clientName} projectName={projectName} lines={lines}
            low={low} high={high} depositLow={depositLow} depositHigh={depositHigh}
            hostingChoice={typeVal === 'none' ? null : hostingChoice} maintPlan={maintPlan}
            lineTotalMid={(low + high) / 2}
            saveFlash={saveFlash} onSave={saveEstimate}
            copyFlash={copyFlash} onCopy={copyAsText}
            finalPrice={finalPrice} setFinalPrice={setFinalPrice}
            finalPriceTouched={finalPriceTouched} setFinalPriceTouched={setFinalPriceTouched}
            paymentTerms={paymentTerms} setPaymentTerms={setPaymentTerms}
            invoiceType={invoiceType} setInvoiceType={changeInvoiceType}
            invoiceFlash={invoiceFlash} onDownloadInvoice={downloadInvoice}
            folderPickerSupported={folderPickerSupported} folderName={folderName} onChooseFolder={chooseFolder}
          />
        </div>
      </div>
    </div>
  );
}
