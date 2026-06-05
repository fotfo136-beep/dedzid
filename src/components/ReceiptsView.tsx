import React, { useState, useEffect, useRef } from 'react';
import { 
  Receipt, Plus, Search, Filter, Calendar, Users, Phone, MapPin, 
  Trash2, Download, Share2, Copy, Check, Printer, ArrowUpRight, 
  Coins, Wallet, CreditCard, DollarSign, CheckCircle2, RefreshCw, X
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Estimate, Client, BusinessProfile, PaymentReceipt } from '../types';

interface ReceiptsViewProps {
  recentEstimates: Estimate[];
  clients: Client[];
  businessProfile: BusinessProfile;
  onNavigateToTab: (tab: 'home' | 'estimate' | 'settings' | 'features' | 'receipts') => void;
}

export default function ReceiptsView({
  recentEstimates,
  clients,
  businessProfile,
  onNavigateToTab
}: ReceiptsViewProps) {
  // Persistence for payment receipts
  const [payments, setPayments] = useState<PaymentReceipt[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState<string>('All');
  
  // UI views & active states
  const [selectedReceiptId, setSelectedReceiptId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [shareSuccess, setShareSuccess] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states for recorded payments
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [customClientName, setCustomClientName] = useState<string>('');
  const [customClientPhone, setCustomClientPhone] = useState<string>('');
  const [linkToEstimate, setLinkToEstimate] = useState<boolean>(true);
  const [selectedEstimateId, setSelectedEstimateId] = useState<string>('');
  const [projectName, setProjectName] = useState<string>('');
  const [amountPaid, setAmountPaid] = useState<number | ''>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentReceipt['paymentMethod']>('Cash');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [receivedBy, setReceivedBy] = useState<string>(businessProfile.name || '');
  const [notes, setNotes] = useState<string>('');

  // Handle toast alert notifications
  const [toast, setToast] = useState<{ type: 'success' | 'info' | 'error', msg: string } | null>(null);
  const triggerToast = (type: 'success' | 'info' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // Synchronous loading of payments from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('estim8_payments');
      if (stored) {
        setPayments(JSON.parse(stored));
      } else {
        // Seed default template payments if none exist to make it look professional on launch
        const defaultSamplePayments: PaymentReceipt[] = [
          {
            id: "RCP-20260603-0518",
            estimateId: "E8-20260603-0001",
            clientName: "Ama Mensah",
            clientPhone: "+233 24 456 7890",
            projectName: "Living Room Renovation (Tiling)",
            amountPaid: 7500,
            paymentMethod: "Mobile Money",
            paymentDate: "2026-06-03",
            transactionRef: "MTN-884920199",
            receivedBy: businessProfile.name || "Estim8 Operator",
            notes: "70% mobilization deposit advanced prior to tile purchase.",
            totalEstimateAmount: 10830
          },
          {
            id: "RCP-20260604-0912",
            estimateId: "E8-20260603-0002",
            clientName: "Kwame Boateng",
            clientPhone: "+233 20 888 1234",
            projectName: "Full Gypsum Ceilings (POP)",
            amountPaid: 5000,
            paymentMethod: "Bank Transfer",
            paymentDate: "2026-06-04",
            transactionRef: "FT-BB-002891",
            receivedBy: businessProfile.name || "Estim8 Operator",
            notes: "Initial advance for scaffolding and materials logistics.",
            totalEstimateAmount: 11832.5
          }
        ];
        setPayments(defaultSamplePayments);
        localStorage.setItem('estim8_payments', JSON.stringify(defaultSamplePayments));
      }
    } catch (e) {
      console.error("Failed to load sample payments: ", e);
    }
  }, [businessProfile.name]);

  // Sync payments back of any updates
  const savePaymentsToStorage = (updatedList: PaymentReceipt[]) => {
    setPayments(updatedList);
    localStorage.setItem('estim8_payments', JSON.stringify(updatedList));
  };

  // Find dynamic estimates belonging to chosen client
  const clientEstimates = recentEstimates.filter(est => {
    // If selected select box client is loaded
    if (selectedClientId && selectedClientId !== 'custom') {
      const foundClient = clients.find(c => c.id === selectedClientId);
      return foundClient && est.clientName.toLowerCase() === foundClient.name.toLowerCase();
    }
    return true; // if custom client is selected
  });

  // Automatically select the newly created or selected receipt
  useEffect(() => {
    if (payments.length > 0 && !selectedReceiptId) {
      setSelectedReceiptId(payments[0].id);
    }
  }, [payments, selectedReceiptId]);

  // Reset form to pristine state
  const resetForm = () => {
    setSelectedClientId('');
    setCustomClientName('');
    setCustomClientPhone('');
    setLinkToEstimate(true);
    setSelectedEstimateId('');
    setProjectName('');
    setAmountPaid('');
    setPaymentMethod('Cash');
    setTransactionRef('');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    setReceivedBy(businessProfile.name || '');
    setNotes('');
  };

  // Handle choice of Client dropdown
  const handleClientSelect = (clientId: string) => {
    setSelectedClientId(clientId);
    if (clientId === 'custom' || !clientId) {
      setCustomClientName('');
      setCustomClientPhone('');
      setSelectedEstimateId('');
      setProjectName('');
    } else {
      const found = clients.find(c => c.id === clientId);
      if (found) {
        setCustomClientName(found.name);
        setCustomClientPhone(found.phone || '');
        
        // Auto seek matching estimates
        const matchingEsts = recentEstimates.filter(est => est.clientName.toLowerCase() === found.name.toLowerCase());
        if (matchingEsts.length > 0) {
          setSelectedEstimateId(matchingEsts[0].id);
          setProjectName(matchingEsts[0].projectName);
          // Set estimate amount paid helper if estimate is selected
        } else {
          setSelectedEstimateId('');
          setProjectName('Standalone Contract Work');
        }
      }
    }
  };

  // Handle choice of Estimate dropdown
  const handleEstimateSelect = (estimateId: string) => {
    setSelectedEstimateId(estimateId);
    if (estimateId) {
      const foundEst = recentEstimates.find(e => e.id === estimateId);
      if (foundEst) {
        setProjectName(foundEst.projectName);
        // Pre-fill amount paid as remaining balance or default 70% advance
        const prePaidAmount = payments
          .filter(p => p.estimateId === estimateId)
          .reduce((sum, p) => sum + p.amountPaid, 0);
        const remaining = Math.max(0, foundEst.grandTotal - prePaidAmount);
        setAmountPaid(remaining > 0 ? Number(remaining.toFixed(2)) : Number(foundEst.grandTotal.toFixed(2)));
        
        // Sync client if mismatched
        const matchedClient = clients.find(c => c.name.toLowerCase() === foundEst.clientName.toLowerCase());
        if (matchedClient) {
          setSelectedClientId(matchedClient.id);
          setCustomClientName(matchedClient.name);
          setCustomClientPhone(matchedClient.phone || '');
        } else {
          setSelectedClientId('custom');
          setCustomClientName(foundEst.clientName);
          setCustomClientPhone('');
        }
      }
    }
  };

  // Record payment in the database
  const handleSavePaymentReceipt = (e: React.FormEvent) => {
    e.preventDefault();

    const finalClientName = selectedClientId === 'custom' || !selectedClientId ? customClientName.trim() : (clients.find(c => c.id === selectedClientId)?.name || customClientName.trim());
    if (!finalClientName) {
      triggerToast('error', 'Please provide a valid Customer Name!');
      return;
    }

    if (!amountPaid || Number(amountPaid) <= 0) {
      triggerToast('error', 'Please enter a payment amount greater than zero.');
      return;
    }

    let referencedEstTotal: number | undefined;
    if (linkToEstimate && selectedEstimateId) {
      const targetedEst = recentEstimates.find(est => est.id === selectedEstimateId);
      if (targetedEst) referencedEstTotal = targetedEst.grandTotal;
    }

    const uniqueReceiptId = `RCP-${new Date(paymentDate).toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newReceipt: PaymentReceipt = {
      id: uniqueReceiptId,
      estimateId: linkToEstimate && selectedEstimateId ? selectedEstimateId : undefined,
      clientName: finalClientName,
      clientPhone: selectedClientId === 'custom' || !selectedClientId ? customClientPhone.trim() : (clients.find(c => c.id === selectedClientId)?.phone || customClientPhone.trim()),
      projectName: projectName.trim() || 'General Services Rendered',
      amountPaid: Number(amountPaid),
      paymentMethod,
      paymentDate,
      transactionRef: transactionRef.trim() || undefined,
      receivedBy: receivedBy.trim() || businessProfile.name || 'Authorized Agent',
      notes: notes.trim() || undefined,
      totalEstimateAmount: referencedEstTotal
    };

    const updated = [newReceipt, ...payments];
    savePaymentsToStorage(updated);
    setSelectedReceiptId(newReceipt.id);
    setIsRecording(false);
    resetForm();
    triggerToast('success', `Payment Receipt of ${formatCurrency(newReceipt.amountPaid)} registered successfully!`);
  };

  const handleDeleteReceipt = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = payments.filter(p => p.id !== id);
    savePaymentsToStorage(updated);
    setDeleteConfirmId(null);
    if (selectedReceiptId === id) {
      setSelectedReceiptId(updated.length > 0 ? updated[0].id : null);
    }
    triggerToast('info', 'Payment receipt removed securely.');
  };

  // Helper to format currency values using Business Profile preferences
  const formatCurrency = (num: number) => {
    const cur = businessProfile.currency || 'GHS';
    const symbol = cur === 'USD' ? '$' : cur === 'GBP' ? '£' : 'GH₵';
    const locale = cur === 'USD' ? 'en-US' : cur === 'GBP' ? 'en-GB' : 'en-GH';
    return symbol + " " + num.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getActiveReceipt = () => {
    return payments.find(p => p.id === selectedReceiptId) || null;
  };

  const activeReceipt = getActiveReceipt();

  // Calculate stats for displays
  const getTotalsStats = () => {
    const totalReceived = payments.reduce((sum, p) => sum + p.amountPaid, 0);
    
    const currentMonthStr = new Date().toISOString().substring(0, 7); // YYYY-MM
    const currentMonthTotal = payments
      .filter(p => p.paymentDate.startsWith(currentMonthStr))
      .reduce((sum, p) => sum + p.amountPaid, 0);

    const mCash = payments.filter(p => p.paymentMethod === 'Cash').reduce((sum, p) => sum + p.amountPaid, 0);
    const mMoMo = payments.filter(p => p.paymentMethod === 'Mobile Money').reduce((sum, p) => sum + p.amountPaid, 0);
    const mBank = payments.filter(p => p.paymentMethod === 'Bank Transfer').reduce((sum, p) => sum + p.amountPaid, 0);

    return { totalReceived, currentMonthTotal, mCash, mMoMo, mBank };
  };

  const stats = getTotalsStats();

  // Generate copyable text and WhatsApp link for convenient message dispatch to client
  const generateReceiptTextForSharing = (receipt: PaymentReceipt) => {
    const dateFormatted = new Date(receipt.paymentDate).toLocaleDateString(undefined, { 
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
    });

    let msg = `*CONFIRMED PAYMENT RECEIPT* 🧾\n`;
    msg += `*${businessProfile.name.toUpperCase()}*\n`;
    if (businessProfile.slogan) msg += `_${businessProfile.slogan}_\n`;
    msg += `----------------------------------------\n`;
    msg += `*Receipt Reference:* ${receipt.id}\n`;
    msg += `*Payment Date:* ${dateFormatted}\n`;
    msg += `*Received From:* ${receipt.clientName}\n`;
    if (receipt.clientPhone) msg += `*Phone:* ${receipt.clientPhone}\n`;
    msg += `*Project Work:* ${receipt.projectName}\n`;
    msg += `----------------------------------------\n\n`;
    msg += `*AMOUNT CONFIRMED:* *${formatCurrency(receipt.amountPaid)}*\n`;
    msg += `*Payment Method:* ${receipt.paymentMethod}\n`;
    if (receipt.transactionRef) msg += `*Reference Code/STAMP:* ${receipt.transactionRef}\n`;
    msg += `*Issued By:* ${receipt.receivedBy || 'Staff Representative'}\n`;
    
    if (receipt.notes) {
      msg += `\n*Transaction Memo:* ${receipt.notes}\n`;
    }

    if (receipt.estimateId && receipt.totalEstimateAmount) {
      // Calculate previous and remaining balances
      const previousPayments = payments
        .filter(p => p.estimateId === receipt.estimateId && p.id !== receipt.id && new Date(p.paymentDate) <= new Date(receipt.paymentDate))
        .reduce((sum, p) => sum + p.amountPaid, 0);
      
      const totalPaidToDate = previousPayments + receipt.amountPaid;
      const balanceRemaining = Math.max(0, receipt.totalEstimateAmount - totalPaidToDate);

      msg += `\n*Estimated Project Total:* ${formatCurrency(receipt.totalEstimateAmount)}\n`;
      msg += `*Total Sum Received to Date:* ${formatCurrency(totalPaidToDate)}\n`;
      msg += `*Outstanding Balance: * *${formatCurrency(balanceRemaining)}*\n`;
    }

    msg += `\nThank you for doing business with us!\n`;
    msg += `For support call: ${businessProfile.phone}`;
    return msg;
  };

  const triggerWhatsAppDispatch = (receipt: PaymentReceipt) => {
    const encoded = encodeURIComponent(generateReceiptTextForSharing(receipt));
    const url = `https://api.whatsapp.com/send?phone=${receipt.clientPhone?.replace(/\s+/g, '') || ''}&text=${encoded}`;
    window.open(url, '_blank');
    setShareSuccess('Receipt WhatsApp dispatch link generated! Routing...');
    setTimeout(() => setShareSuccess(null), 3500);
  };

  const triggerClipboardCopy = (receipt: PaymentReceipt) => {
    const raw = generateReceiptTextForSharing(receipt).replace(/\*/g, '');
    navigator.clipboard.writeText(raw).then(() => {
      setCopiedText(true);
      setTimeout(() => setCopiedText(false), 2000);
    });
  };

  // Generate Branded PDF Receipt
  const downloadReceiptPdf = (receipt: PaymentReceipt) => {
    const cur = businessProfile.currency || 'GHS';
    const getSafePdfSymbol = (currencyCode: string) => {
      if (currencyCode === 'USD') return '$';
      if (currencyCode === 'GBP') return String.fromCharCode(163); 
      return 'GHS';
    };
    const symbol = getSafePdfSymbol(cur);

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const activeColorHex = {
      blue: '#2563eb',
      emerald: '#059669',
      amber: '#d97706',
      terracotta: '#ea580c',
      charcoal: '#4b5563'
    }[localStorage.getItem('estim8_theme') || 'blue'] || '#2563eb';

    const hexToRgb = (hex: string) => {
      const match = hex.replace('#', '').match(/.{1,2}/g);
      return match ? match.map(x => parseInt(x, 16)) : [37, 99, 235];
    };
    const rgb = hexToRgb(activeColorHex);

    const fontPrimary = 'helvetica';
    let y = 0;

    // Header Background Header Banner
    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.rect(0, 0, 210, 36, 'F');

    // Horizontal dark strip
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 36, 210, 2.5, 'F');

    // White box/image for Logo if present
    let textX = 15;
    if (businessProfile.logo) {
      try {
        doc.setFillColor(255, 255, 255);
        doc.rect(13, 8, 20, 20, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.2);
        doc.rect(13, 8, 20, 20, 'S');
        doc.addImage(businessProfile.logo, 'PNG', 14.5, 9.5, 17, 17, undefined, 'FAST');
        textX = 38;
      } catch (e) {
        console.error("PDF logo load skip", e);
      }
    }

    // Write corporate profile
    doc.setFont(fontPrimary, 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text(businessProfile.name.toUpperCase(), textX, 14);

    if (businessProfile.slogan) {
      doc.setFont(fontPrimary, 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(241, 245, 249);
      doc.text(businessProfile.slogan, textX, 19, { maxWidth: 100 });
    }

    doc.setFont(fontPrimary, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(226, 232, 240);
    const croppedLoc = (businessProfile.location || 'Accra').length > 35 
      ? (businessProfile.location || 'Accra').slice(0, 32) + '...'
      : (businessProfile.location || 'Accra');
    doc.text(`Location: ${croppedLoc}  |  Phone: ${businessProfile.phone}`, textX, 25);

    // Right-Aligned Top Meta Badge
    doc.setFont(fontPrimary, 'bold');
    doc.setFontSize(13);
    doc.setTextColor(255, 255, 255);
    doc.text('PAYMENT RECEIPT', 195, 13, { align: 'right' });

    doc.setFont(fontPrimary, 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(241, 245, 249);
    doc.text(`RECEIPT REF: ${receipt.id}`, 195, 19, { align: 'right' });

    // Dates
    const creationDateStr = new Date(receipt.paymentDate).toLocaleDateString(undefined, { 
      month: 'long', day: 'numeric', year: 'numeric' 
    });
    doc.setFont(fontPrimary, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(226, 232, 240);
    doc.text(`Receipt Date: ${creationDateStr}`, 195, 25, { align: 'right' });

    y = 44;

    // parallel cards layout
    doc.setFillColor(248, 250, 252);
    doc.rect(15, y, 87, 28, 'F');
    doc.rect(108, y, 87, 28, 'F');

    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.2);
    doc.rect(15, y, 87, 28, 'S');
    doc.rect(108, y, 87, 28, 'S');

    doc.setFillColor(rgb[0], rgb[1], rgb[2]);
    doc.rect(15, y, 2.5, 28, 'F');
    doc.rect(108, y, 2.5, 28, 'F');

    // Customer specifications
    doc.setFont(fontPrimary, 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    doc.text('CUSTOMER INFORMATION', 21, y + 5.5);

    doc.setFont(fontPrimary, 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(receipt.clientName, 21, y + 11.5);

    doc.setFont(fontPrimary, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Tel: ${receipt.clientPhone || 'N/A'}`, 21, y + 17);
    const linkIndicator = receipt.estimateId ? `Estimate Link Ref: ${receipt.estimateId}` : 'Standalone Order';
    doc.text(linkIndicator, 21, y + 22.5);

    // Work / Project Specs
    doc.setFont(fontPrimary, 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    doc.text('TRANSACTION SUMMARY', 114, y + 5.5);

    doc.setFont(fontPrimary, 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    const croppedProj = receipt.projectName.length > 32 
      ? receipt.projectName.slice(0, 29) + '...' 
      : receipt.projectName;
    doc.text(croppedProj, 114, y + 11.5);

    doc.setFont(fontPrimary, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(`Method: ${receipt.paymentMethod}`, 114, y + 17);
    doc.text(`Reference ID: ${receipt.transactionRef || 'N/A'}`, 114, y + 22.5);

    y = 80;

    // Table Header for payments Breakdown
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 180, 8, 'F');
    
    doc.setFont(fontPrimary, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('TRANSACTION LEDGER DETAILS', 20, y + 5.5);
    doc.text('AMOUNT PAID', 190, y + 5.5, { align: 'right' });

    y += 8;

    // Draw row
    doc.setDrawColor(241, 245, 249);
    doc.line(15, y, 195, y);
    doc.setLineWidth(0.1);

    y += 6;
    doc.setFont(fontPrimary, 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Description: Cleared mobilization/progress payment received', 20, y);
    
    doc.setFont(fontPrimary, 'bold');
    doc.text(`${symbol} ${receipt.amountPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}`, 190, y, { align: 'right' });

    y += 4;
    doc.setDrawColor(241, 245, 249);
    doc.line(15, y, 195, y);

    y += 10;

    // Financial calculations box
    doc.setFillColor(250, 250, 250);
    doc.rect(108, y, 87, 40, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.15);
    doc.rect(108, y, 87, 40, 'S');

    // Right aligned costs structure
    doc.setFont(fontPrimary, 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(rgb[0], rgb[1], rgb[2]);
    doc.text('FINANCIAL STATEMENT SUMMARY', 113, y + 6);

    let offset = y + 13;

    // Subtotal Row
    doc.setFont(fontPrimary, 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('CONFIRMED RECEIVED AMOUNT:', 113, offset);
    doc.setFont(fontPrimary, 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${symbol} ${receipt.amountPaid.toLocaleString(undefined, {minimumFractionDigits: 2})}`, 190, offset, { align: 'right' });

    offset += 6.5;

    if (receipt.estimateId && receipt.totalEstimateAmount) {
      // Calculate previous and remaining balances
      const previousPayments = payments
        .filter(p => p.estimateId === receipt.estimateId && p.id !== receipt.id && new Date(p.paymentDate) <= new Date(receipt.paymentDate))
        .reduce((sum, p) => sum + p.amountPaid, 0);
      
      const totalPaidToDate = previousPayments + receipt.amountPaid;
      const balanceRemaining = Math.max(0, receipt.totalEstimateAmount - totalPaidToDate);

      doc.setFont(fontPrimary, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('Estimated Project Contract Total:', 113, offset);
      doc.text(`${symbol} ${receipt.totalEstimateAmount.toLocaleString(undefined, {minimumFractionDigits: 2})}`, 190, offset, { align: 'right' });

      offset += 6.5;

      doc.text('Total Received Accumulated:', 113, offset);
      doc.text(`${symbol} ${totalPaidToDate.toLocaleString(undefined, {minimumFractionDigits: 2})}`, 190, offset, { align: 'right' });

      offset += 6.5;
      doc.setFillColor(rgb[0], rgb[1], rgb[2], 0.08);
      doc.rect(112, offset - 3.5, 79, 5.5, 'F');
      
      doc.setFont(fontPrimary, 'bold');
      doc.setFontSize(8);
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      doc.text('UNPAID BALANCE OUTSTANDING:', 113, offset.toFixed(1) as any ? offset : offset);
      doc.text(`${symbol} ${balanceRemaining.toLocaleString(undefined, {minimumFractionDigits: 2})}`, 190, offset, { align: 'right' });
    } else {
      // Standalone
      doc.setFont(fontPrimary, 'normal');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text('Cumulative Ledger Sync:', 113, offset);
      doc.text('Standalone Clearance', 190, offset, { align: 'right' });

      offset += 6.5;
      doc.text('Record Type:', 113, offset);
      doc.text('Direct Payment Confirm', 190, offset, { align: 'right' });

      offset += 6.5;
      doc.setFillColor(rgb[0], rgb[1], rgb[2], 0.08);
      doc.rect(112, offset - 3.5, 79, 5.5, 'F');

      doc.setFont(fontPrimary, 'bold');
      doc.setFontSize(8);
      doc.setTextColor(rgb[0], rgb[1], rgb[2]);
      doc.text('STATUS DESIGNATION:', 113, offset);
      doc.text('FULLY CLEARED & CONFIRMED', 190, offset, { align: 'right' });
    }

    // Left Memo detail box
    const endY = offset + 10;
    
    doc.setFillColor(254, 252, 232);
    doc.rect(15, y, 84, 15, 'F');
    doc.setDrawColor(254, 240, 138);
    doc.rect(15, y, 84, 15, 'S');

    doc.setFont(fontPrimary, 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(113, 63, 18);
    doc.text('TRANSACTION MEMO:', 18, y + 4.5);
    
    doc.setFont(fontPrimary, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(133, 77, 14);
    const commentNotes = receipt.notes || 'This payment has been fully received, deposited, and cleared in our accounting ledger.';
    doc.text(commentNotes, 18, y + 8.5, { maxWidth: 78 });


    // Large bold watermarked PAID stamp centered below
    let stampOffset = endY + 15;
    if (stampOffset < 140) stampOffset = 145;

    doc.setFillColor(220, 252, 231);
    doc.rect(15, stampOffset, 180, 20, 'F');
    doc.setDrawColor(187, 247, 208);
    doc.rect(15, stampOffset, 180, 20, 'S');

    doc.setFont(fontPrimary, 'bold');
    doc.setFontSize(11);
    doc.setTextColor(21, 128, 61);
    doc.text('★ CONFIRMED TRANSACTION CLEARED & ARCHIVED ★', 105, stampOffset + 8.5, { align: 'center' });
    
    doc.setFont(fontPrimary, 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(21, 128, 61);
    doc.text(`Authorized representative signature not required for digital receipts. Verified by ${receipt.receivedBy || 'Estim8'}.`, 105, stampOffset + 14.5, { align: 'center' });

    // Terms and footer disclaimer
    doc.setFont(fontPrimary, 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('TERMS OF DIGITAL PAYMENT & RECEIPTS:', 15, stampOffset + 30);

    doc.setFont(fontPrimary, 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('1. All payments are non-refundable unless specified otherwise in the physical contract or service level agreements signed.\n2. Receipts are generated automatically via digital bookkeeping interfaces. For inquiries regarding ledger balance, contact office support.\n3. Digital stamps verify immediate clearing. Re-printed versions are valid records under trade standard bookkeeping.', 15, stampOffset + 35, { maxWidth: 180 });

    // Footer copyright line
    doc.setFont(fontPrimary, 'bolditalic');
    doc.setFontSize(6.5);
    doc.setTextColor(203, 213, 225);
    doc.text(`System generated receipt of ${businessProfile.name} booked via Estim8 Portal. Page 1 of 1`, 105, 285, { align: 'center' });

    // Export PDF
    doc.save(`Receipt-${receipt.id}.pdf`);
    triggerToast('success', `PDF of receipt ${receipt.id} downloaded!`);
  };

  // Inline Print Handler
  const triggerReceiptPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in font-sans" id="receipts-module-wrapper">
      
      {/* Dynamic Toast Element */}
      {toast && (
        <div 
          className={`fixed bottom-4 right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl border text-xs font-black shadow-lg animate-bounce ${
            toast.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 dark:bg-emerald-500/20' 
              : toast.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 dark:bg-rose-500/20'
              : 'bg-primary/10 border-primary/20 text-primary dark:bg-primary/20'
          }`}
          id="receipt-toast-alert"
        >
          <CheckCircle2 className="h-4.5 w-4.5 shrink-0" />
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Top visual Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-card pb-4" id="receipts-header-tab">
        <div>
          <h1 className="text-xl font-extrabold text-text-main flex items-center gap-2">
            <span className="p-1.5 bg-primary/10 rounded-lg text-primary">
              <Receipt className="h-6 w-6" />
            </span>
            Payments & Receipts
          </h1>
          <p className="text-xs text-text-muted mt-1 font-semibold">
            Track customer payments, manage deposit clearances, and dispatch branded PDFs or WhatsApp receipts instantly.
          </p>
        </div>

        <button
          onClick={() => {
            setIsRecording(!isRecording);
            if (!isRecording) resetForm();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm ${
            isRecording 
              ? 'bg-text-main text-bg-card border border-border-card' 
              : 'bg-primary text-white hover:bg-primary-hover hover:scale-102'
          }`}
          id="btn-trigger-record-payment"
        >
          {isRecording ? (
            <>
              <X className="h-4 w-4" />
              <span>Cancel Recording</span>
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" />
              <span>Record Customer Payment</span>
            </>
          )}
        </button>
      </div>

      {/* Visual Analytics metric Row */}
      {!isRecording && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="payment-revenue-kpi-cards">
          
          <div className="bg-bg-card border border-border-card p-4 rounded-2xl flex items-center gap-4 hover:border-primary/30 transition-all">
            <div className="h-11 w-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Coins className="h-5 w-5" />
            </div>
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">Total Booked Ledger</span>
              <span className="text-base font-black text-text-main block mt-0.5">{formatCurrency(stats.totalReceived)}</span>
            </div>
          </div>

          <div className="bg-bg-card border border-border-card p-4 rounded-2xl flex items-center gap-4 hover:border-emerald-500/30 transition-all">
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">This Month's Inflow</span>
              <span className="text-base font-black text-emerald-600 block mt-0.5">{formatCurrency(stats.currentMonthTotal)}</span>
            </div>
          </div>

          <div className="bg-bg-card border border-border-card p-4 rounded-2xl flex items-center gap-4 hover:border-amber-500/30 transition-all">
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">Mobile Money Confirmed</span>
              <span className="text-base font-black text-amber-600 block mt-0.5">{formatCurrency(stats.mMoMo)}</span>
            </div>
          </div>

          <div className="bg-bg-card border border-border-card p-4 rounded-2xl flex items-center gap-4 hover:border-indigo-500/30 transition-all">
            <div className="h-11 w-11 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
              <CreditCard className="h-5 w-5" />
            </div>
            <div className="text-left">
              <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider block">Bank Transfers Invoiced</span>
              <span className="text-base font-black text-indigo-500 block mt-0.5">{formatCurrency(stats.mBank)}</span>
            </div>
          </div>

        </div>
      )}

      {/* Main Core Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6" id="receipts-core-grid">

        {/* Dynamic Payment Recording Form */}
        {isRecording ? (
          <div className="xl:col-span-12 bg-bg-card border-2 border-primary/20 p-6 rounded-2xl shadow-sm space-y-6" id="recording-form-container">
            <div className="border-b border-border-card pb-3">
              <h2 className="text-sm font-black uppercase text-primary tracking-wider flex items-center gap-2">
                ✍️ CONFIRM NEW CUSTOMER PAYMENT SLIP
              </h2>
              <p className="text-xs text-text-muted mt-1 font-semibold">
                This transaction converts estimates parameters into physical revenue balances. Filling fields updates client invoice ledger logs.
              </p>
            </div>

            <form onSubmit={handleSavePaymentReceipt} className="space-y-5" id="receipt-register-form">
              
              {/* Linked parameters settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-border-card/50">
                <div className="space-y-2">
                  <label className="text-[11px] font-black text-text-muted uppercase tracking-wider block">1. Select Payer Card from Directory</label>
                  <select
                    value={selectedClientId}
                    onChange={(e) => handleClientSelect(e.target.value)}
                    className="w-full h-11 px-3 border border-border-card rounded-xl text-xs font-semibold bg-bg-panel/50 cursor-pointer focus:ring-2 focus:ring-primary/25 focus:outline-hidden"
                    id="receipt-payer-select"
                  >
                    <option value="">-- Choose Registered Contact --</option>
                    {clients.map(c => (
                      <option key={c.id} value={c.id}>
                        👥 {c.name} {c.phone ? `(${c.phone})` : ''}
                      </option>
                    ))}
                    <option value="custom">👤 ➕ Register Custom / Off-book Name</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black text-text-muted uppercase tracking-wider flex items-center justify-between">
                    <span>2. Connect to Material Estimate Quote?</span>
                    <input 
                      type="checkbox" 
                      checked={linkToEstimate}
                      onChange={(e) => setLinkToEstimate(e.target.checked)}
                      className="h-4 w-4 cursor-pointer accent-primary"
                    />
                  </label>
                  <select
                    value={selectedEstimateId}
                    onChange={(e) => handleEstimateSelect(e.target.value)}
                    disabled={!linkToEstimate}
                    className="w-full h-11 px-3 border border-border-card rounded-xl text-xs font-semibold bg-bg-panel/50 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:ring-2 focus:ring-primary/25 focus:outline-hidden"
                    id="receipt-estimate-select"
                  >
                    <option value="">-- Choose Project Estimate Worksheet --</option>
                    {clientEstimates.map(est => (
                      <option key={est.id} value={est.id}>
                        📐 [{est.id}] {est.clientName} - {est.projectName} ({formatCurrency(est.grandTotal)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Detailed input profiles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="detailed-payment-form-grid">
                
                {/* Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase">Client Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Payer's business name"
                    value={customClientName}
                    onChange={(e) => setCustomClientName(e.target.value)}
                    disabled={selectedClientId !== 'custom' && selectedClientId !== ''}
                    className="w-full h-11 px-3 border border-border-card rounded-xl text-xs text-text-main bg-bg-panel/20 focus:ring-2 focus:ring-primary/20 disabled:opacity-75 disabled:cursor-not-allowed"
                    id="receipt-form-client-name"
                  />
                </div>

                {/* Telephone */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase">Customer Phone number</label>
                  <input
                    type="text"
                    placeholder="e.g. +233 24 123 4567"
                    value={customClientPhone}
                    onChange={(e) => setCustomClientPhone(e.target.value)}
                    disabled={selectedClientId !== 'custom' && selectedClientId !== ''}
                    className="w-full h-11 px-3 border border-border-card rounded-xl text-xs text-text-main bg-bg-panel/20 focus:ring-2 focus:ring-primary/20 disabled:opacity-75 disabled:cursor-not-allowed"
                    id="receipt-form-client-phone"
                  />
                </div>

                {/* Project Service Name */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase">Project Contract Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Interior painting, Gypsum POP ceilings, etc"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    className="w-full h-11 px-3 border border-border-card rounded-xl text-xs text-text-main bg-bg-panel/20 focus:ring-2 focus:ring-primary/20"
                    id="receipt-form-project-name"
                  />
                </div>

                {/* Received By */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase">Received By Representative</label>
                  <input
                    type="text"
                    placeholder="Bookkeeper or business name"
                    value={receivedBy}
                    onChange={(e) => setReceivedBy(e.target.value)}
                    className="w-full h-11 px-3 border border-border-card rounded-xl text-xs text-text-main bg-bg-panel/20 focus:ring-2 focus:ring-primary/20"
                    id="receipt-form-staff-rep"
                  />
                </div>

                {/* Clear Cash paid */}
                <div className="space-y-1 col-span-1 sm:col-span-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase flex justify-between">
                    <span>Payment Confirm Amount *</span>
                    {selectedEstimateId && (
                      <span className="text-[9px] font-black text-primary uppercase">
                        Worksheet Total: {formatCurrency(recentEstimates.find(e => e.id === selectedEstimateId)?.grandTotal || 0)}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">
                      {businessProfile.currency || 'GHS'}
                    </span>
                    <input
                      type="number"
                      required
                      step="any"
                      placeholder="e.g. 8500"
                      value={amountPaid}
                      onChange={(e) => setAmountPaid(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full h-11 pl-12 pr-3 border border-border-card rounded-xl text-xs font-bold text-text-main bg-bg-panel/10 focus:ring-2 focus:ring-primary/20"
                      id="receipt-form-amount-paid"
                    />
                  </div>

                  {/* Helper prefilled percentage Shortcuts */}
                  {selectedEstimateId && (() => {
                    const est = recentEstimates.find(e => e.id === selectedEstimateId);
                    if (!est) return null;
                    const prePaid = payments
                      .filter(p => p.estimateId === est.id)
                      .reduce((sum, p) => sum + p.amountPaid, 0);
                    const bal = Math.max(0, est.grandTotal - prePaid);
                    
                    return (
                      <div className="flex flex-wrap gap-1.5 pt-1.5" id="form-amount-rate-shortcuts">
                        <button
                          type="button"
                          onClick={() => setAmountPaid(Number(est.grandTotal.toFixed(2)))}
                          className="px-2 py-1 text-[9px] font-black rounded-lg bg-bg-panel text-text-muted hover:bg-primary/10 hover:text-primary"
                        >
                          Full Cost ({formatCurrency(est.grandTotal)})
                        </button>
                        <button
                          type="button"
                          onClick={() => setAmountPaid(Number((est.grandTotal * 0.7).toFixed(2)))}
                          className="px-2 py-1 text-[9px] font-black rounded-lg bg-bg-panel text-text-muted hover:bg-primary/10 hover:text-primary"
                        >
                          70% Advance ({formatCurrency(est.grandTotal * 0.7)})
                        </button>
                        <button
                          type="button"
                          onClick={() => setAmountPaid(Number((est.grandTotal * 0.5).toFixed(2)))}
                          className="px-2 py-1 text-[9px] font-black rounded-lg bg-bg-panel text-text-muted hover:bg-primary/10 hover:text-primary"
                        >
                          50% Milestone ({formatCurrency(est.grandTotal * 0.5)})
                        </button>
                        {bal > 0 && bal !== est.grandTotal && (
                          <button
                            type="button"
                            onClick={() => setAmountPaid(Number(bal.toFixed(2)))}
                            className="px-2 py-1 text-[9px] font-black rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                          >
                            Unpaid Balance ({formatCurrency(bal)})
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Method */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase">Payment Mode</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full h-11 px-3 border border-border-card rounded-xl text-xs font-semibold bg-bg-panel/50 cursor-pointer focus:outline-hidden"
                    id="receipt-form-method-select"
                  >
                    <option value="Cash">💵 Cash</option>
                    <option value="Mobile Money">📱 Mobile Money</option>
                    <option value="Bank Transfer">🏦 Bank Transfer</option>
                    <option value="Cheque">✍️ Written Cheque</option>
                    <option value="Other">⚙️ Other</option>
                  </select>
                </div>

                {/* Transaction reference Stamp */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase">Transaction Code / Cheque #</label>
                  <input
                    type="text"
                    placeholder="e.g. MTN-28394 or CHQ-002"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full h-11 px-3 border border-border-card rounded-xl text-xs text-text-main bg-bg-panel/20 focus:ring-2 focus:ring-primary/20"
                    id="receipt-form-tx-ref"
                  />
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase">Payment Valuation Date</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full h-11 px-3 border border-border-card rounded-xl text-xs text-text-main bg-bg-panel/20 focus:ring-2 focus:ring-primary/20"
                    id="receipt-form-date"
                  />
                </div>

                {/* Comments / Memo */}
                <div className="space-y-1 sm:col-span-3">
                  <label className="text-[10px] font-bold text-text-muted uppercase">Private ledger Remarks / Transaction Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Mobilization for POP materials supply to Osu branch site address."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-11 px-3 border border-border-card rounded-xl text-xs text-text-main bg-bg-panel/20 focus:ring-2 focus:ring-primary/20"
                    id="receipt-form-memo"
                  />
                </div>

              </div>

              {/* Confirm submit actions */}
              <div className="flex gap-3 justify-end pt-4 border-t border-border-card" id="form-actions-footer">
                <button
                  type="button"
                  onClick={() => setIsRecording(false)}
                  className="px-5 h-11 rounded-1.5xl border border-border-card text-xs font-black text-text-muted hover:text-text-main hover:bg-bg-panel transition-all duration-150 cursor-pointer"
                  id="btn-cancel-recording"
                >
                  Discard Payment
                </button>
                <button
                  type="submit"
                  className="px-6 h-11 rounded-1.5xl bg-primary hover:bg-primary-hover text-white text-xs font-black transition-all hover:scale-102 cursor-pointer shadow-md shadow-primary/10"
                  id="btn-submit-recorded-payment"
                >
                  Authorized Clear Receipt ✓
                </button>
              </div>

            </form>
          </div>
        ) : (
          <>
            {/* Left Ledger Database list */}
            <div className="xl:col-span-5 space-y-4" id="ledger-history-column">
              
              {/* Filter components & Search */}
              <div className="bg-bg-card border border-border-card p-4 rounded-2xl space-y-3" id="ledger-filters-box">
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-muted" />
                  <input
                    type="text"
                    placeholder="Search payer, reference, or project name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-9 pl-9 pr-3 border border-border-card rounded-xl text-xs text-text-main focus:outline-hidden focus:ring-2 focus:ring-primary/20 bg-bg-panel/50"
                    id="ledger-search-input"
                  />
                </div>

                {/* Quick select filters scrollbar */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none" id="method-filters-scroller">
                  {['All', 'Cash', 'Mobile Money', 'Bank Transfer', 'Cheque'].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setMethodFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold shrink-0 transition-all cursor-pointer ${
                        methodFilter === f 
                          ? 'bg-primary text-white font-extrabold' 
                          : 'bg-bg-panel text-text-muted hover:text-text-main hover:bg-border-card'
                      }`}
                      id={`filter-button-${f.toLowerCase().replace(/\s+/g, '-')}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

              </div>

              {/* Main lists matching */}
              <div className="space-y-2.5 max-h-[580px] overflow-y-auto scrollbar-thin pr-1" id="receipt-documents-ledger-list">
                {(() => {
                  const query = searchQuery.toLowerCase().trim();
                  
                  // Run queries
                  const filtered = payments.filter(payment => {
                    const matchedText = payment.clientName.toLowerCase().includes(query) ||
                      payment.id.toLowerCase().includes(query) ||
                      payment.projectName.toLowerCase().includes(query) ||
                      (payment.transactionRef?.toLowerCase() || '').includes(query);

                    const matchedFilter = methodFilter === 'All' || payment.paymentMethod === methodFilter;

                    return matchedText && matchedFilter;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="bg-bg-card border border-dashed border-border-card rounded-2xl py-12 px-4 text-center">
                        <span className="text-3xl block filter grayscale opacity-75">🧾</span>
                        <h4 className="text-xs font-black text-text-main mt-3">No Receipts Registered</h4>
                        <p className="text-[10px] text-text-muted mt-1 max-w-xs mx-auto">
                          Choose another mode filter or record a quick advance payment from Osu/Airport residential client list.
                        </p>
                      </div>
                    );
                  }

                  return filtered.map(item => {
                    const isSelected = selectedReceiptId === item.id;
                    const dateFormatted = new Date(item.paymentDate).toLocaleDateString(undefined, { 
                      month: 'short', day: 'numeric', year: 'numeric' 
                    });

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedReceiptId(item.id)}
                        className={`text-left p-4 rounded-2xl border transition-all cursor-pointer flex justify-between items-start gap-3 select-none ${
                          isSelected 
                            ? 'bg-bg-card border-primary ring-2 ring-primary/10 shadow-sm' 
                            : 'bg-bg-card border-border-card hover:border-text-muted'
                        }`}
                        id={`receipt-card-item-${item.id}`}
                      >
                        {/* Summary details */}
                        <div className="space-y-1 block min-w-0" id={`receipt-ledger-core-${item.id}`}>
                          <div className="flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                            <span className="text-[11px] font-extrabold text-primary uppercase tracking-wide truncate">
                              {item.id}
                            </span>
                          </div>
                          
                          <h3 className="text-xs font-bold text-text-main truncate max-w-[195px] pr-1">
                            {item.clientName}
                          </h3>

                          <p className="text-[10px] text-text-muted truncate max-w-[190px]">
                            Project: {item.projectName}
                          </p>

                          <div className="flex items-center gap-2 pt-1 font-mono text-[9px] text-text-muted">
                            <span>{dateFormatted}</span>
                            <span>•</span>
                            <span className="bg-bg-panel px-1.5 py-0.5 rounded-sm font-sans font-black uppercase text-[8px] text-text-muted">
                              {item.paymentMethod}
                            </span>
                          </div>
                        </div>

                        {/* Amount & action */}
                        <div className="text-right shrink-0 flex flex-col items-end justify-between min-h-[75px]" id={`receipt-ledger-pricing-${item.id}`}>
                          <span className="text-xs font-black text-primary">
                            {formatCurrency(item.amountPaid)}
                          </span>

                          {/* Delete confirmed box */}
                          <div onClick={(e) => e.stopPropagation()}>
                            {deleteConfirmId === item.id ? (
                              <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 p-0.5 rounded-md">
                                <button
                                  type="button"
                                  onClick={(e) => handleDeleteReceipt(item.id, e)}
                                  className="px-1.5 py-0.5 text-[8px] font-black bg-red-600 text-white rounded-sm cursor-pointer"
                                  id={`confirm-delete-receipt-${item.id}`}
                                >
                                  Delete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setDeleteConfirmId(null)}
                                  className="text-[9px] text-text-muted p-0.5 cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(item.id)}
                                className="p-1 text-text-muted hover:text-red-500 hover:bg-bg-panel rounded-lg cursor-pointer"
                                title="Delete booked receipt record"
                                id={`trash-clear-receipt-${item.id}`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  });
                })()}
              </div>

            </div>

            {/* Right aesthetic preview paper card */}
            <div className="xl:col-span-7" id="paper-receipt-scroller">
              {activeReceipt ? (
                <div className="bg-bg-card border border-border-card rounded-2xl overflow-hidden shadow-xs flex flex-col" id="rendered-receipt-parent">
                  
                  {/* Top utility actions panel */}
                  <div className="bg-bg-panel/75 border-b border-border-card px-4 py-3 flex flex-wrap gap-2 items-center justify-between" id="receipt-action-center">
                    <span className="text-[10px] font-black text-text-muted uppercase tracking-wide">
                      ⚡ Action dispatch center
                    </span>

                    <div className="flex items-center gap-1.5">
                      {/* Download PDF button */}
                      <button
                        onClick={() => downloadReceiptPdf(activeReceipt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black rounded-lg bg-bg-card hover:bg-primary/10 hover:text-primary text-text-main border border-border-card transition-all cursor-pointer"
                        title="Download branded formal A4 PDF slip"
                        id="btn-pdf-download-receipt"
                      >
                        <Download className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>PDF / Download</span>
                      </button>

                      {/* Web print button */}
                      <button
                        onClick={triggerReceiptPrint}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black rounded-lg bg-bg-card hover:bg-primary/10 hover:text-primary text-text-main border border-border-card transition-all cursor-pointer"
                        title="Print receipt on paper/POS"
                        id="btn-print-receipt"
                      >
                        <Printer className="h-3.5 w-3.5 text-text-muted shrink-0" />
                        <span>POS / Print</span>
                      </button>

                      {/* WhatsApp text share trigger */}
                      <button
                        onClick={() => triggerWhatsAppDispatch(activeReceipt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-all cursor-pointer shadow-xs select-none"
                        title="Dispatch formatted confirmation receipt to Client on WhatsApp"
                        id="btn-whatsapp-receipt"
                      >
                        <Share2 className="h-3.5 w-3.5 shrink-0 animate-pulse" />
                        <span>Client WhatsApp</span>
                      </button>

                      {/* Copy summary */}
                      <button
                        onClick={() => triggerClipboardCopy(activeReceipt)}
                        className="p-1.5 rounded-lg bg-bg-card hover:bg-border-card border border-border-card text-text-muted cursor-pointer hover:text-text-main shrink-0"
                        title="Copy confirmation receipt details to Clipboard"
                        id="btn-copy-receipt"
                      >
                        {copiedText ? (
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Share success feedback inline banner */}
                  {shareSuccess && (
                     <p className="bg-emerald-500/10 border-b border-emerald-500/20 text-emerald-700 text-[10px] font-black text-center py-1.5 animate-pulse">
                       {shareSuccess}
                     </p>
                  )}

                  {/* Paper printable body */}
                  <div className="p-6 md:p-8 space-y-6 text-left selection:bg-primary/15" id="printable-area-receipt">
                    
                    {/* Header brand and tag */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-card/80 pb-4">
                      
                      <div className="text-left flex items-center gap-2">
                        {businessProfile.logo ? (
                          <img 
                            src={businessProfile.logo} 
                            alt={`${businessProfile.name} Logo`}
                            className="h-10 w-10 rounded-xl object-contain border border-border-card p-0.5 bg-white"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <span className="h-10 w-10 rounded-xl bg-primary text-white font-extrabold flex items-center justify-center">
                            E8
                          </span>
                        )}
                        <div className="text-left">
                          <h2 className="text-sm font-black text-text-main leading-none">
                            {businessProfile.name.toUpperCase()}
                          </h2>
                          <p className="text-[10px] text-text-muted mt-1 italic font-semibold">
                            {businessProfile.slogan || "Professional Ceiling, Tiling, & Painting Finish"}
                          </p>
                        </div>
                      </div>

                      {/* Receipt title badge */}
                      <div className="text-left sm:text-right">
                        <span className="inline-block px-3 py-1 bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase rounded-full tracking-wider">
                          Transaction Cleared
                        </span>
                        <div className="text-xs font-mono font-black text-text-main mt-1">
                          REF: {activeReceipt.id}
                        </div>
                        <div className="text-[10px] text-text-muted font-bold">
                          Issued: {new Date(activeReceipt.paymentDate).toLocaleDateString(undefined, {month: 'long', day: 'numeric', year: 'numeric'})}
                        </div>
                      </div>

                    </div>

                    {/* parallel client / project details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      
                      <div className="bg-bg-panel/50 border border-border-card/70 rounded-2xl p-4 space-y-1.5">
                        <span className="text-[9px] font-black uppercase text-text-muted tracking-wide block">
                          🧑 Customer details
                        </span>
                        <h4 className="text-xs font-bold text-text-main">{activeReceipt.clientName}</h4>
                        {activeReceipt.clientPhone && (
                          <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                            <Phone className="h-3 w-3 text-neutral-400 shrink-0" />
                            <span>{activeReceipt.clientPhone}</span>
                          </div>
                        )}
                        <div className="text-[9px] text-text-muted pt-1">
                          {activeReceipt.estimateId ? (
                            <span>Linked Estimate: <strong className="text-primary font-bold">{activeReceipt.estimateId}</strong></span>
                          ) : (
                            <span className="italic text-neutral-400">Standalone direct payment book</span>
                          )}
                        </div>
                      </div>

                      <div className="bg-bg-panel/50 border border-border-card/70 rounded-2xl p-4 space-y-1.5">
                        <span className="text-[9px] font-black uppercase text-text-muted tracking-wide block">
                          💼 Work contract summary
                        </span>
                        <h4 className="text-xs font-bold text-text-main">{activeReceipt.projectName}</h4>
                        
                        <div className="flex items-center gap-1.5 text-[10px] text-text-muted">
                          <Wallet className="h-3 w-3 text-neutral-400 shrink-0" />
                          <span>Mode: {activeReceipt.paymentMethod}</span>
                        </div>

                        {activeReceipt.transactionRef && (
                          <div className="text-[10px] text-text-muted flex items-center gap-1">
                            <span className="font-semibold">STAMP Reference:</span>
                            <span className="font-mono bg-bg-card border border-border-card px-1.5 py-0.5 rounded-sm text-[9px]">
                              {activeReceipt.transactionRef}
                            </span>
                          </div>
                        )}
                      </div>

                    </div>

                    {/* Ledger details row */}
                    <div className="border border-border-card/70 rounded-2xl overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-bg-panel text-[10px] font-bold text-text-muted uppercase tracking-wider">
                          <tr>
                            <th className="px-4 py-2.5">Clearing item description</th>
                            <th className="px-4 py-2.5 text-right">Settled Invoiced Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border-card/50 text-text-main">
                          <tr>
                            <td className="px-4 py-3">
                              <span className="font-bold flex items-center gap-1">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" /> Cleared contract milestone progress credit
                              </span>
                              <span className="text-[10px] text-text-muted mt-1 block">
                                Digital verification stamp confirm deposited credits fully cleared by ledger banks.
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600">
                              {formatCurrency(activeReceipt.amountPaid)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Financial balance calculations logs */}
                    <div className="flex flex-col md:flex-row gap-4 items-stretch justify-between" id="receipt-financial-math-ledger">
                      
                      {/* Left Remark notes */}
                      <div className="bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 flex-1 text-xs">
                        <span className="font-black text-amber-700 block uppercase tracking-wider text-[9px] mb-1">
                          📝 Bookkeeper Memo Notes
                        </span>
                        <p className="text-text-muted leading-relaxed font-semibold">
                          {activeReceipt.notes || "This payment was verified and booked securely in Estim8 digital ledger records. Client account cleared for subsequent material delivery/milestone progression."}
                        </p>
                      </div>

                      {/* Right Balance logic */}
                      <div className="border border-border-card rounded-2xl p-4 w-full md:w-80 space-y-2 bg-neutral-50/50" id="inflow-reconciles">
                        
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-text-muted">Cleared deposition:</span>
                          <span className="font-bold text-text-main">{formatCurrency(activeReceipt.amountPaid)}</span>
                        </div>

                        {activeReceipt.estimateId && activeReceipt.totalEstimateAmount ? (() => {
                          const previousPayments = payments
                            .filter(p => p.estimateId === activeReceipt.estimateId && p.id !== activeReceipt.id && new Date(p.paymentDate) <= new Date(activeReceipt.paymentDate))
                            .reduce((sum, p) => sum + p.amountPaid, 0);

                          const totalAccumulated = previousPayments + activeReceipt.amountPaid;
                          const remainingOutstanding = Math.max(0, activeReceipt.totalEstimateAmount - totalAccumulated);

                          return (
                            <>
                              <div className="flex justify-between items-center text-xs">
                                <span className="text-text-muted">Project contract total:</span>
                                <span className="font-semibold text-text-main">{formatCurrency(activeReceipt.totalEstimateAmount)}</span>
                              </div>
                              <div className="flex justify-between items-center text-xs select-none">
                                <span className="text-text-muted">Total cleared to-date:</span>
                                <span className="font-semibold text-primary">{formatCurrency(totalAccumulated)}</span>
                              </div>
                              <div className="border-t border-border-card pt-2 flex justify-between items-center text-xs font-bold text-primary bg-primary/5 p-1.5 rounded-lg select-all">
                                <span className="text-primary-hover font-black">OUTSTANDING BALANCE:</span>
                                <span className="font-black text-primary-hover">{formatCurrency(remainingOutstanding)}</span>
                              </div>
                            </>
                          );
                        })() : (
                          <>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-text-muted">Record specification:</span>
                              <span className="font-semibold italic text-neutral-500">Standalone direct transaction</span>
                            </div>
                            <div className="border-t border-border-card pt-2 flex justify-between items-center text-xs font-bold text-emerald-600 bg-emerald-500/5 p-1.5 rounded-lg select-all">
                              <span className="font-black uppercase">STATUS CONFIRMED:</span>
                              <span className="font-black">PAID IN FULL</span>
                            </div>
                          </>
                        )}

                      </div>

                    </div>

                    {/* Paid Stamp graphic */}
                    <div className="relative border-2 border-dashed border-emerald-500/20 bg-emerald-500/5 rounded-2xl p-5 text-center flex flex-col items-center justify-center min-h-[90px]" id="visual-paid-stamp">
                      <div className="absolute right-6 top-3 text-[14px] text-emerald-500 opacity-20 font-black tracking-widest scale-125 pointer-events-none select-none uppercase rotate-12">
                        ★ ESTIM8 VERIFIED ★
                      </div>
                      <h4 className="text-xs font-black text-emerald-700 flex items-center justify-center gap-1 uppercase tracking-wider">
                        🛡️ Ledger Confirmed Receipts Stamp
                      </h4>
                      <p className="text-[10px] text-emerald-600/90 mt-1 max-w-xl font-medium">
                        This digital record indicates funds have been authorized, cleared, and audited against the active client invoice worksheet. Issued by <strong className="font-bold">{activeReceipt.receivedBy || "Accounting Board"}</strong>. Thank you for your partnership!
                      </p>
                    </div>

                  </div>

                </div>
              ) : (
                <div className="bg-bg-card border border-border-card rounded-2xl p-12 text-center" id="empty-preview-block">
                  <span className="text-4xl block filter grayscale opacity-50">🧾</span>
                  <h3 className="text-xs font-black text-text-main mt-4">Select receipt document</h3>
                  <p className="text-[10px] text-text-muted mt-1 max-w-xs mx-auto">
                    Select a logged deposit from the left history database timeline ledger list to configure, print, copy metadata, or download.
                  </p>
                </div>
              )}
            </div>

          </>
        )}

      </div>

    </div>
  );
}
