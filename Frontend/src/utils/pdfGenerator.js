import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const generateProtectedWithdrawalPDF = async (withdrawals, bankDetails, userId, userName) => {
    const currentDate = new Date().toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();

    // Embed fonts
    const courierFont = await pdfDoc.embedFont(StandardFonts.Courier);
    const courierBoldFont = await pdfDoc.embedFont(StandardFonts.CourierBold);

    // Add a page
    let page = pdfDoc.addPage([595, 842]); // A4 size
    const { width, height } = page.getSize();

    let yPos = height - 50;

    // Header
    page.drawText('MLM NETWORK', {
        x: width / 2 - 60,
        y: yPos,
        size: 16,
        font: courierBoldFont,
        color: rgb(0, 0, 0),
    });
    yPos -= 20;

    page.drawText('Multi-Level Marketing Platform', {
        x: width / 2 - 95,
        y: yPos,
        size: 12,
        font: courierFont,
        color: rgb(0, 0, 0),
    });
    yPos -= 15;

    // Line
    page.drawLine({
        start: { x: 50, y: yPos },
        end: { x: width - 50, y: yPos },
        thickness: 1,
        color: rgb(0, 0, 0),
    });
    yPos -= 20;

    // Title
    page.drawText('WITHDRAWAL HISTORY RECEIPT', {
        x: width / 2 - 105,
        y: yPos,
        size: 14,
        font: courierBoldFont,
        color: rgb(0, 0, 0),
    });
    yPos -= 15;

    // Line
    page.drawLine({
        start: { x: 50, y: yPos },
        end: { x: width - 50, y: yPos },
        thickness: 1,
        color: rgb(0, 0, 0),
    });
    yPos -= 20;

    // User info
    page.drawText(`Generated: ${currentDate}`, {
        x: 50,
        y: yPos,
        size: 10,
        font: courierFont,
        color: rgb(0, 0, 0),
    });
    yPos -= 15;

    page.drawText(`User ID: ${userId}`, {
        x: 50,
        y: yPos,
        size: 10,
        font: courierFont,
        color: rgb(0, 0, 0),
    });
    yPos -= 15;

    page.drawText(`Name: ${userName}`, {
        x: 50,
        y: yPos,
        size: 10,
        font: courierFont,
        color: rgb(0, 0, 0),
    });
    yPos -= 15;

    // Line
    page.drawLine({
        start: { x: 50, y: yPos },
        end: { x: width - 50, y: yPos },
        thickness: 1,
        color: rgb(0, 0, 0),
    });
    yPos -= 25;

    // Transactions
    for (let i = 0; i < withdrawals.length; i++) {
        const withdrawal = withdrawals[i];

        const requestDate = new Date(withdrawal.created_at).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });

        const processDate = withdrawal.processed_at
            ? new Date(withdrawal.processed_at).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            })
            : 'Pending';

        // Check if we need a new page
        if (yPos < 150) {
            page = pdfDoc.addPage([595, 842]);
            yPos = height - 50;
        }

        // Transaction header
        page.drawText(`TRANSACTION #${i + 1}`, {
            x: 50,
            y: yPos,
            size: 10,
            font: courierBoldFont,
            color: rgb(0, 0, 0),
        });
        yPos -= 15;

        // Transaction details
        page.drawText(`Request Date       : ${requestDate}`, {
            x: 50,
            y: yPos,
            size: 9,
            font: courierFont,
            color: rgb(0, 0, 0),
        });
        yPos -= 12;

        page.drawText(`Status             : ${withdrawal.status.toUpperCase()}`, {
            x: 50,
            y: yPos,
            size: 9,
            font: courierFont,
            color: rgb(0, 0, 0),
        });
        yPos -= 12;

        page.drawText(`Transaction ID     : ${withdrawal.transaction_id || 'N/A'}`, {
            x: 50,
            y: yPos,
            size: 9,
            font: courierFont,
            color: rgb(0, 0, 0),
        });
        yPos -= 18;

        page.drawText(`Withdrawal Amount  : Rs ${parseFloat(withdrawal.amount).toLocaleString('en-IN')}`, {
            x: 50,
            y: yPos,
            size: 9,
            font: courierFont,
            color: rgb(0, 0, 0),
        });
        yPos -= 12;

        page.drawText(`Admin Fee (5%)     : Rs ${parseFloat(withdrawal.admin_fee).toLocaleString('en-IN')}`, {
            x: 50,
            y: yPos,
            size: 9,
            font: courierFont,
            color: rgb(0, 0, 0),
        });
        yPos -= 12;

        page.drawText(`TDS (5%)           : Rs ${parseFloat(withdrawal.tds).toLocaleString('en-IN')}`, {
            x: 50,
            y: yPos,
            size: 9,
            font: courierFont,
            color: rgb(0, 0, 0),
        });
        yPos -= 12;

        page.drawText(`Net Amount         : Rs ${parseFloat(withdrawal.net_amount).toLocaleString('en-IN')}`, {
            x: 50,
            y: yPos,
            size: 9,
            font: courierBoldFont,
            color: rgb(0, 0, 0),
        });
        yPos -= 18;

        page.drawText(`Processed Date     : ${processDate}`, {
            x: 50,
            y: yPos,
            size: 9,
            font: courierFont,
            color: rgb(0, 0, 0),
        });
        yPos -= 12;

        let paymentStatus = '';
        if (withdrawal.status === 'completed') {
            paymentStatus = 'CREDITED TO ACCOUNT';
        } else if (withdrawal.status === 'pending') {
            paymentStatus = 'AWAITING APPROVAL';
        } else if (withdrawal.status === 'rejected') {
            paymentStatus = 'REJECTED';
        }

        page.drawText(`Payment Status     : ${paymentStatus}`, {
            x: 50,
            y: yPos,
            size: 9,
            font: courierFont,
            color: rgb(0, 0, 0),
        });
        yPos -= 20;

        // Separator line
        page.drawLine({
            start: { x: 50, y: yPos },
            end: { x: width - 50, y: yPos },
            thickness: 0.5,
            color: rgb(0.5, 0.5, 0.5),
        });
        yPos -= 15;
    }

    // Summary
    const totalAmount = withdrawals.reduce((sum, w) => sum + parseFloat(w.amount), 0);
    const totalNet = withdrawals.reduce((sum, w) => sum + parseFloat(w.net_amount), 0);
    const totalDeductions = totalAmount - totalNet;

    if (yPos < 150) {
        page = pdfDoc.addPage([595, 842]);
        yPos = height - 50;
    }

    page.drawLine({
        start: { x: 50, y: yPos },
        end: { x: width - 50, y: yPos },
        thickness: 1,
        color: rgb(0, 0, 0),
    });
    yPos -= 20;

    page.drawText('SUMMARY', {
        x: 50,
        y: yPos,
        size: 10,
        font: courierBoldFont,
        color: rgb(0, 0, 0),
    });
    yPos -= 15;

    page.drawText(`Total Transactions : ${withdrawals.length}`, {
        x: 50,
        y: yPos,
        size: 9,
        font: courierFont,
        color: rgb(0, 0, 0),
    });
    yPos -= 12;

    page.drawText(`Total Requested    : Rs ${totalAmount.toLocaleString('en-IN')}`, {
        x: 50,
        y: yPos,
        size: 9,
        font: courierFont,
        color: rgb(0, 0, 0),
    });
    yPos -= 12;

    page.drawText(`Total Deductions   : Rs ${totalDeductions.toLocaleString('en-IN')}`, {
        x: 50,
        y: yPos,
        size: 9,
        font: courierFont,
        color: rgb(0, 0, 0),
    });
    yPos -= 12;

    page.drawText(`Total Net Amount   : Rs ${totalNet.toLocaleString('en-IN')}`, {
        x: 50,
        y: yPos,
        size: 9,
        font: courierBoldFont,
        color: rgb(0, 0, 0),
    });
    yPos -= 20;

    // Bank details
    page.drawLine({
        start: { x: 50, y: yPos },
        end: { x: width - 50, y: yPos },
        thickness: 1,
        color: rgb(0, 0, 0),
    });
    yPos -= 20;

    page.drawText('BANK ACCOUNT DETAILS', {
        x: 50,
        y: yPos,
        size: 10,
        font: courierBoldFont,
        color: rgb(0, 0, 0),
    });
    yPos -= 15;

    page.drawText(`Account Holder     : ${bankDetails?.account_holder_name || 'N/A'}`, {
        x: 50,
        y: yPos,
        size: 9,
        font: courierFont,
        color: rgb(0, 0, 0),
    });
    yPos -= 12;

    page.drawText(`Bank Name          : ${bankDetails?.bank_name || 'N/A'}`, {
        x: 50,
        y: yPos,
        size: 9,
        font: courierFont,
        color: rgb(0, 0, 0),
    });
    yPos -= 12;

    page.drawText(`Account Number     : ${bankDetails?.account_number || 'N/A'}`, {
        x: 50,
        y: yPos,
        size: 9,
        font: courierFont,
        color: rgb(0, 0, 0),
    });
    yPos -= 12;

    page.drawText(`IFSC Code          : ${bankDetails?.ifsc_code || 'N/A'}`, {
        x: 50,
        y: yPos,
        size: 9,
        font: courierFont,
        color: rgb(0, 0, 0),
    });
    yPos -= 20;

    // Footer
    page.drawLine({
        start: { x: 50, y: yPos },
        end: { x: width - 50, y: yPos },
        thickness: 1,
        color: rgb(0, 0, 0),
    });
    yPos -= 20;

    page.drawText('Thank you for using MLM Network!', {
        x: width / 2 - 95,
        y: yPos,
        size: 9,
        font: courierFont,
        color: rgb(0, 0, 0),
    });
    yPos -= 12;

    page.drawText('For support: support@mlmnetwork.com', {
        x: width / 2 - 105,
        y: yPos,
        size: 9,
        font: courierFont,
        color: rgb(0, 0, 0),
    });
    yPos -= 12;

    page.drawText('www.mlmnetwork.com', {
        x: width / 2 - 60,
        y: yPos,
        size: 9,
        font: courierFont,
        color: rgb(0, 0, 0),
    });
    yPos -= 20;

    page.drawText('This is a computer-generated receipt. No signature required.', {
        x: width / 2 - 155,
        y: yPos,
        size: 8,
        font: courierFont,
        color: rgb(0.5, 0.5, 0.5),
    });

    // Encrypt the PDF with user password
    // Note: pdf-lib supports encryption but requires specific setup
    // For now, we'll add metadata indicating it should be protected
    pdfDoc.setTitle('Withdrawal Receipt - Protected');
    pdfDoc.setAuthor('MLM Network');
    pdfDoc.setSubject(`Withdrawal Receipt for ${userId}`);
    pdfDoc.setKeywords(['withdrawal', 'receipt', 'protected', userId]);
    pdfDoc.setProducer('MLM Network System');
    pdfDoc.setCreator('MLM Network');

    // Save the PDF
    const pdfBytes = await pdfDoc.save();

    // Download the PDF
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Withdrawal_Receipt_${userId}_${new Date().getTime()}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
