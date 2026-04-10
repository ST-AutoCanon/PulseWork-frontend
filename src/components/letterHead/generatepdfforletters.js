


import jsPDF from 'jspdf';
import logoBase64Data from './logo-base64.js';

const {
  insigniaRomanFont,
  logoBase64,
  emailIconBase64,
  websiteIconBase64,
  phoneIconBase64,
} = logoBase64Data || {};

const generatePDF = async (
  element,
  letterType,
  logoUrl,
  recipientName,
  employeeName,
  position,
  effectiveDate,
  companyName,
  gstinNumber,
  cinNumber,
  address,
  preview = false
) => {
  try {
    const doc = new jsPDF({
      unit: 'pt',
      format: 'a4',
      orientation: 'portrait',
    });

    // Add the Insignia Roman font
    let fontLoaded = false;
    try {
      if (insigniaRomanFont && typeof insigniaRomanFont === 'string' && insigniaRomanFont.length > 0) {
        doc.addFileToVFS('InsigniaRoman.ttf', insigniaRomanFont);
        doc.addFont('InsigniaRoman.ttf', 'InsigniaRoman', 'normal');
        doc.setFont('InsigniaRoman', 'normal');
        fontLoaded = true;
      }
    } catch (error) {
      console.error('Error adding Insignia Roman font:', error);
      fontLoaded = false;
    }

    // Layout constants
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const rightPadding = 20;
    const contentWidth = pageWidth - 2 * margin - rightPadding;
    const footerHeight = 80;
    const baseLineHeight = 14;
    const paragraphSpacing = 15;
    const headerSpacing = 10;
    const iconSize = 8;
    const tableCellPadding = 5;
    const tableBorderWidth = 0.5;
    const tableCellHeight = 20;

    // Load logo image
     let logoImage="data:image/png;base64,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";
    if (!logoImage && logoUrl) {
      try {
        const response = await fetch(logoUrl);
        if (!response.ok) throw new Error(`Failed to fetch logo: ${response.statusText}`);
        const blob = await response.blob();
        logoImage = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Error reading logo file'));
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('Error fetching logo:', error);
      }
    }

    // Add watermark function
    const addWatermark = () => {
      if (logoImage?.startsWith('data:image/png;base64,')) {
        try {
          doc.setGState(new doc.GState({ opacity: 0.15 }));
          doc.addImage(
            logoImage,
            'PNG',
            (pageWidth - 240) / 2,
            (pageHeight - 240) / 2,
            240,
            240,
            undefined,
            'FAST'
          );
          doc.setGState(new doc.GState({ opacity: 1 }));
        } catch (error) {
          console.error('Error adding watermark:', error);
        }
      }
    };

    // Add footer function
    const addFooter = (pageNumber, totalPages) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);

      const contactInfo = {
        email: 'admin@sukalpatechsolutions.com',
        website: 'https://sukalpatechsolutions.com',
        phone: '+91 78928-59968',
      };
      const address = companyName
        ? `${companyName} | #71, Bauxite Road, Sarathi Nagar, Belagavi -591108`
        : 'Sukalpa Tech Solutions Pvt Ltd. | #71, Bauxite Road, Sarathi Nagar, Belagavi -591108';
      const pageInfo = `Page ${pageNumber} of ${totalPages}`;

      const footerY = pageHeight - footerHeight;
      const centerX = pageWidth / 2;
      const gapBetweenItems = 20;
      const iconTextGap = 5;
      const iconVerticalOffset = 2;

      // Add blue-green lines above footer icons
      const lineWidth = 450;
      const lineSpacing = 4;
      const lineY = footerY - 5;

      // Green Line (75% solid, 25% dotted)
      doc.setDrawColor(145, 219, 69);
      doc.setLineWidth(1);
      const solidLength = lineWidth * 0.75;
      doc.line(
        centerX - lineWidth / 2,
        lineY,
        centerX - lineWidth / 2 + solidLength,
        lineY
      );
      doc.setLineDash([2, 2], 0);
      doc.line(
        centerX - lineWidth / 2 + solidLength,
        lineY,
        centerX + lineWidth / 2,
        lineY
      );
      doc.setLineDash();

      // Blue Line
      doc.setDrawColor(0, 40, 111);
      doc.setLineWidth(3);
      doc.line(
        centerX - lineWidth / 2,
        lineY + lineSpacing,
        centerX + lineWidth / 2,
        lineY + lineSpacing
      );

      const contactY = footerY + 15;
      const contactItems = [
        { icon: emailIconBase64, text: contactInfo.email },
        { icon: websiteIconBase64, text: contactInfo.website },
        { icon: phoneIconBase64, text: contactInfo.phone },
      ];

      let totalContactWidth = 0;
      const itemWidths = contactItems.map((item) => {
        const textWidth = doc.getTextWidth(item.text);
        const itemWidth = (item.icon ? iconSize + iconTextGap : 0) + textWidth;
        totalContactWidth += itemWidth + (totalContactWidth > 0 ? gapBetweenItems : 0);
        return itemWidth;
      });

      let contactX = centerX - totalContactWidth / 2;

      contactItems.forEach(({ icon, text }, index) => {
        try {
          if (icon) {
            const iconY = contactY - iconSize / 2 + iconVerticalOffset;
            const textY = iconY + iconSize / 2 + 2;
            doc.addImage(icon, 'PNG', contactX, iconY, iconSize, iconSize);
            doc.text(text, contactX + iconSize + iconTextGap, textY);
            contactX += itemWidths[index] + gapBetweenItems;
          } else {
            doc.text(text, contactX, contactY);
            contactX += itemWidths[index] + gapBetweenItems;
          }
        } catch (error) {
          console.error(`Error adding contact icon for ${text}:`, error);
          doc.text(text, contactX, contactY);
          contactX += itemWidths[index] + gapBetweenItems;
        }
      });

      const addressY = contactY + 15;
      doc.text(address, centerX, addressY, { align: 'center' });
      doc.text(pageInfo, centerX, addressY + 15, { align: 'center' });
    };

    // Add header function
    const addHeader = () => {
      let logoHeight = 0;
      if (logoImage?.startsWith('data:image/png;base64,')) {
        try {
          doc.addImage(logoImage, 'PNG', margin - 5, margin - 28, undefined, undefined);
          logoHeight = 60;
        } catch (error) {
          console.error('Error adding header logo:', error);
        }
      }

      try {
        doc.setFont(fontLoaded ? 'InsigniaRoman' : 'helvetica', 'normal');
        doc.setFontSize(26);
        doc.setTextColor('#0F6679');
        const companyNameText = companyName || 'Sukalpa Tech Solutions Pvt. Ltd.';
        const logoRightEdge = margin + 80 + 10;
        doc.text(companyNameText, logoRightEdge, margin + 25);

        doc.setFont(fontLoaded ? 'InsigniaRoman' : 'helvetica', 'normal');
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        const taglineText = 'Let us join to support you deserve';
        doc.text(taglineText, logoRightEdge, margin + 60);
      } catch (error) {
        console.error('Error adding heading:', error);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(20);
        doc.setTextColor('#0F6679');
        doc.text(companyName || 'Sukalpa Tech Solutions Pvt. Ltd.', margin + 90, margin + 25);
      }

      const headerBottom = margin + Math.max(logoHeight, 55) + 15;
      doc.setDrawColor(145, 219, 69);
      doc.setLineWidth(1);
      const lineLength = pageWidth - 2 * margin;
      const solidLength = lineLength * 0.75;
      doc.line(margin, headerBottom, margin + solidLength, headerBottom);
      doc.setLineDash([2, 2], 0);
      doc.line(margin + solidLength, headerBottom, pageWidth - margin, headerBottom);
      doc.setLineDash();
      doc.setDrawColor(0, 40, 111);
      doc.setLineWidth(3);
      doc.line(margin, headerBottom + 4, pageWidth - margin, headerBottom + 4);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.setLineDash();
      return headerBottom + baseLineHeight;
    };

    // Add signature function
    const addSignature = () => {
      const signatureText = ['Yours sincerely,', ...doc.splitTextToSize(element.querySelector('.letterhead-input-field[placeholder="Signature (Your Name, Designation)"]')?.value || 'Your Name, Designation', contentWidth)];
      const signatureHeight = signatureText.length * baseLineHeight + 20;
      const linesFit = checkPageOverflow(signatureHeight);
      if (linesFit < signatureText.length) {
        const linesToRender = signatureText.slice(0, linesFit);
        if (linesToRender.length > 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          doc.text(linesToRender[0], margin, yPosition);
          if (linesToRender.length > 1) {
            doc.text(linesToRender.slice(1), margin, yPosition + 20);
          }
          yPosition += linesToRender.length * baseLineHeight + (linesToRender.length > 1 ? 20 : 0);
        }
        addNewPage();
        const remainingLines = signatureText.slice(linesFit);
        if (remainingLines.length > 0) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(11);
          doc.setTextColor(0, 0, 0);
          doc.text(remainingLines[0], margin, yPosition);
          if (remainingLines.length > 1) {
            doc.text(remainingLines.slice(1), margin, yPosition + 20);
          }
          yPosition += remainingLines.length * baseLineHeight + (remainingLines.length > 1 ? 20 : 0);
        }
      } else {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text('Yours sincerely,', margin, yPosition);
        doc.text(signatureText.slice(1), margin, yPosition + 20);
        yPosition += signatureHeight;
      }
    };

    // Function to check page overflow
    const checkPageOverflow = (requiredHeight) => {
      const remainingSpace = pageHeight - yPosition - footerHeight;
      if (remainingSpace < requiredHeight) {
        return Math.max(0, Math.floor(remainingSpace / baseLineHeight));
      }
      return Math.floor(remainingSpace / baseLineHeight);
    };

    // Function to add a new page
    const addNewPage = () => {
      addFooter(doc.getNumberOfPages(), doc.getNumberOfPages() + 1);
      doc.addPage();
      addWatermark();
      headerBottom = addHeader();
      yPosition = headerBottom + 20;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.5);
      doc.setLineDash();
    };

    // Add initial watermark and header
    addWatermark();
    let headerBottom = addHeader();
    let yPosition = headerBottom + 20;

    // Set black color for content
    doc.setTextColor(0, 0, 0);

    // Add date
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    let linesFit = checkPageOverflow(baseLineHeight);
    if (linesFit < 1) {
      addNewPage();
    }
    const dateText = `Date: ${element.querySelector('.letterhead-input-field[placeholder="Date"]')?.value || new Date().toISOString().split('T')[0]}`;
    doc.text(dateText, pageWidth - margin, yPosition, { align: 'right' });
    yPosition += baseLineHeight + paragraphSpacing;

    // Add subject
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const subjectText = `${element.querySelector('.letterhead-input-field[placeholder="Subject"]')?.value || letterType}`;
    const subjectLines = doc.splitTextToSize(subjectText, contentWidth);
    linesFit = checkPageOverflow(subjectLines.length * baseLineHeight);
    if (linesFit < subjectLines.length) {
      const linesToRender = subjectLines.slice(0, linesFit);
      if (linesToRender.length > 0) {
        doc.text(linesToRender, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += linesToRender.length * baseLineHeight;
      }
      addNewPage();
      const remainingLines = subjectLines.slice(linesFit);
      if (remainingLines.length > 0) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        doc.text(remainingLines, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += remainingLines.length * baseLineHeight;
      }
    } else {
      doc.text(subjectLines, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += subjectLines.length * baseLineHeight;
    }
    yPosition += paragraphSpacing;

    // Add recipient address
doc.setFont('helvetica', 'normal');
doc.setFontSize(11);
const addressText = address || '[Recipient Address]';
const titleInput =
  element.querySelector('.letterhead-input-field[placeholder="Title"]') ||
  element.querySelector('input[name="title"], input[name="Title"]') ||
  element.querySelector('#title, #Title');
const titleText = titleInput?.value?.trim() || '';
const isBankDetailsRequest = letterType.toLowerCase() === 'bank details request letter';
const recipientText = isBankDetailsRequest ? '' : (recipientName?.trim() || '[Recipient Name]');
const toText = isBankDetailsRequest ? 'To' : 'To:';
const recipientLine = titleText && !isBankDetailsRequest ? `${titleText} ${recipientText}` : recipientText;

const splitLongAddress = (text, maxWidth) => {
  const lines = [];
  let currentLine = '';
  let wordCount = 0;
  const words = text.trim().split(/\s+/).filter(word => word.length > 0);

  for (let word of words) {
    // Handle long words by splitting them if they exceed contentWidth
    if (doc.getTextWidth(word) > maxWidth) {
      let remainingWord = word;
      while (remainingWord.length > 0) {
        let chunk = remainingWord;
        let chunkWidth = doc.getTextWidth(chunk);
        let charIndex = chunk.length;
        while (chunkWidth > maxWidth && charIndex > 0) {
          charIndex--;
          chunk = remainingWord.slice(0, charIndex);
          chunkWidth = doc.getTextWidth(chunk);
        }
        if (currentLine && wordCount < 4 && doc.getTextWidth(currentLine + ' ' + chunk) <= maxWidth) {
          currentLine += (currentLine ? ' ' : '') + chunk;
          wordCount++;
        } else {
          if (currentLine) lines.push(currentLine);
          currentLine = chunk;
          wordCount = 1;
        }
        remainingWord = remainingWord.slice(charIndex);
        if (wordCount >= 4 || doc.getTextWidth(currentLine) > maxWidth) {
          lines.push(currentLine);
          currentLine = '';
          wordCount = 0;
        }
      }
      continue;
    }

    // Handle regular words
    const separator = currentLine ? ' ' : '';
    if (wordCount < 4 && doc.getTextWidth(currentLine + separator + word) <= maxWidth) {
      currentLine += separator + word;
      wordCount++;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
      wordCount = 1;
    }

    // After adding 4 words, move to the next line
    if (wordCount >= 4) {
      lines.push(currentLine);
      currentLine = '';
      wordCount = 0;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines.filter(line => line.length > 0);
};

linesFit = checkPageOverflow(baseLineHeight);
if (linesFit < 1) {
  addNewPage();
}
doc.text(toText, margin, yPosition);
yPosition += baseLineHeight;

if (!isBankDetailsRequest && recipientLine) {
  linesFit = checkPageOverflow(baseLineHeight);
  if (linesFit < 1) {
    addNewPage();
  }
  const recipientLines = doc.splitTextToSize(recipientLine, contentWidth);
  doc.text(recipientLines, margin, yPosition);
  yPosition += recipientLines.length * baseLineHeight;
}

const addressLabel = 'Address:';
linesFit = checkPageOverflow(baseLineHeight);
if (linesFit < 1) {
  addNewPage();
}
doc.text(addressLabel, margin, yPosition);
yPosition += baseLineHeight;

const addressLines = splitLongAddress(addressText, contentWidth);
linesFit = checkPageOverflow(addressLines.length * baseLineHeight);
if (linesFit < addressLines.length) {
  const linesToRender = addressLines.slice(0, linesFit);
  if (linesToRender.length > 0) {
    doc.text(linesToRender, margin, yPosition);
    yPosition += linesToRender.length * baseLineHeight;
  }
  addNewPage();
  const remainingLines = addressLines.slice(linesFit);
  if (remainingLines.length > 0) {
    doc.text(remainingLines, margin, yPosition);
    yPosition += remainingLines.length * baseLineHeight;
  }
} else {
  doc.text(addressLines, margin, yPosition);
  yPosition += addressLines.length * baseLineHeight;
}
yPosition += paragraphSpacing;    // Add main content with employee details and table support


    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);

    let currentLineSegments = [];
    const allLines = [];
    let lastElementType = null;
    const contentElement = element.querySelector('.letterhead-content-area');
    let htmlContent = contentElement ? contentElement.innerHTML : 'No content provided.';
    console.log('Original HTML Content:', htmlContent);
    htmlContent = htmlContent
      .replace(/\[Recipient Name\]/gi, recipientName?.trim() || '[Recipient Name]')
      .replace(/\[Employee Name\]/gi, employeeName?.trim() || '[Employee Name]')
      .replace(/\[Position\]/gi, position?.trim() || '[Position]')
      .replace(/\[Date\]/gi, effectiveDate || element.querySelector('.letterhead-input-field[placeholder="Date"]')?.value || new Date().toISOString().split('T')[0])
      .replace(/\[Title\]/gi, titleText || '')
      .replace(/\[Mobile Number\]/gi, element.querySelector('.letterhead-input-field[placeholder="Mobile Number"]')?.value?.trim() || '[Mobile Number]')
      .replace(/\[Email\]/gi, element.querySelector('.letterhead-input-field[placeholder="Email"]')?.value?.trim() || '[Email]')
      .replace(/\[Date of Appointment\]/gi, element.querySelector('.letterhead-input-field[placeholder="Date of Appointment"]')?.value?.trim() || '[Date of Appointment]')
      .replace(/\[Annual Salary\]/gi, element.querySelector('.letterhead-input-field[placeholder="Annual Salary"]')?.value?.trim() || '[Annual Salary]')
      .replace(/\[Company Name\]/gi, companyName?.trim() || '[Company Name]')
      .replace(/\[Place\]/gi, element.querySelector('.letterhead-input-field[placeholder="Place"]')?.value?.trim() || '[Place]')
      .replace(/\[Employee ID\]/gi, element.querySelector('.letterhead-input-field[placeholder="Employee ID"]')?.value?.trim() || '[Employee ID]')
      .replace(/\[Date of Birth\]/gi, element.querySelector('.letterhead-input-field[placeholder="Date of Birth"]')?.value?.trim() || '[Date of Birth]')
      .replace(/\[Contact Number\]/gi, element.querySelector('.letterhead-input-field[placeholder="Mobile Number"]')?.value?.trim() || '[Contact Number]')
      .replace(/\[Residential Address\]/gi, element.querySelector('.letterhead-input-field[placeholder="Address"]')?.value?.trim() || '[Residential Address]');
    console.log('Processed HTML Content:', htmlContent);

    const parser = new DOMParser();
    const docHTML = parser.parseFromString(`<div>${htmlContent}</div>`, 'text/html');
    const contentNodes = docHTML.querySelector('div').childNodes;

    const contentSegments = [];

    const processNode = (node, inheritedStyles = {}) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent.trim();
        if (text) {
          contentSegments.push({ text, styles: { ...inheritedStyles } });
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const styles = { ...inheritedStyles };
        if (node.tagName === 'H1') {
          styles.fontSize = 16;
          styles.bold = true;
          styles.elementType = 'header';
        } else if (node.tagName === 'H2') {
          styles.fontSize = 14;
          styles.bold = true;
          styles.elementType = 'subheader';
        } else if (node.tagName === 'P') {
          styles.fontSize = 11;
          styles.elementType = 'paragraph';
        } else if (node.tagName === 'STRONG' || node.tagName === 'B') {
          styles.bold = true;
        } else if (node.tagName === 'I') {
          styles.italic = true;
        } else if (node.tagName === 'U') {
          styles.underline = true;
        } else if (node.tagName === 'TABLE') {
          styles.elementType = 'table';
          contentSegments.push({ table: node, styles });
          return;
        } else if (node.tagName === 'DIV' && node.classList.contains('employee-details')) {
          styles.elementType = 'employee-details';
          const pairs = [];
          let currentLabel = '';
          let isLabel = false;
          node.childNodes.forEach((child) => {
            if (child.nodeType === Node.ELEMENT_NODE && child.tagName === 'STRONG') {
              currentLabel = child.textContent.trim();
              isLabel = true;
            } else if (child.nodeType === Node.TEXT_NODE && isLabel) {
              const value = child.textContent.trim();
              if (value && currentLabel) {
                pairs.push({ label: currentLabel, value });
              }
              isLabel = false;
              currentLabel = '';
            }
          });
          contentSegments.push({ employeeDetails: pairs, styles });
          return;
        }
        if (node.style.backgroundColor) {
          styles.highlight = node.style.backgroundColor === 'rgb(255, 255, 0)' ? '#FFFF00' : node.style.backgroundColor;
        }
        node.childNodes.forEach((child) => processNode(child, styles));
        if (['H1', 'H2', 'P'].includes(node.tagName)) {
          contentSegments.push({ text: '', isBreak: true, elementType: styles.elementType });
        }
      }
    };

    contentNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE && ['H1', 'H2', 'P', 'DIV', 'TABLE'].includes(node.tagName)) {
        const styles = {
          fontSize: node.tagName === 'H1' ? 16 : node.tagName === 'H2' ? 14 : 11,
          elementType: node.tagName === 'H1' ? 'header' : node.tagName === 'H2' ? 'subheader' : node.tagName === 'TABLE' ? 'table' : node.tagName === 'DIV' && node.classList.contains('employee-details') ? 'employee-details' : 'paragraph',
        };
        if (node.tagName === 'TABLE' || (node.tagName === 'DIV' && node.classList.contains('employee-details'))) {
          processNode(node, styles);
        } else {
          node.childNodes.forEach((child) => processNode(child, styles));
          contentSegments.push({ text: '', isBreak: true, elementType: styles.elementType });
        }
      } else {
        processNode(node);
      }
    });

    for (const segment of contentSegments) {
      if (segment.isBreak) {
        if (currentLineSegments.length > 0) {
          allLines.push({ segments: currentLineSegments, elementType: lastElementType });
          currentLineSegments = [];
        }
        allLines.push({ isBreak: true, elementType: segment.elementType });
        lastElementType = segment.elementType;
      } else if (segment.text) {
        currentLineSegments.push(segment);
        lastElementType = segment.styles.elementType || lastElementType;
      } else if (segment.table) {
        if (currentLineSegments.length > 0) {
          allLines.push({ segments: currentLineSegments, elementType: lastElementType });
          currentLineSegments = [];
        }
        allLines.push({ table: segment.table, elementType: 'table', heading: segment.text === 'Annexure-I' ? 'Annexure-I' : null });
        lastElementType = 'table';
      } else if (segment.employeeDetails) {
        if (currentLineSegments.length > 0) {
          allLines.push({ segments: currentLineSegments, elementType: lastElementType });
          currentLineSegments = [];
        }
        allLines.push({ employeeDetails: segment.employeeDetails, elementType: 'employee-details' });
        lastElementType = 'employee-details';
      }
    }
    if (currentLineSegments.length > 0) {
      allLines.push({ segments: currentLineSegments, elementType: lastElementType });
    }

    // Render content
    let signatureAdded = false;
    for (let i = 0; i < allLines.length; i++) {
      const line = allLines[i];
      const isLastLine = i === allLines.length - 1;
      const isTable = line.table && line.elementType === 'table';
      const isEmployeeDetails = line.employeeDetails && line.elementType === 'employee-details';

      if (isLastLine && (isTable || isEmployeeDetails) && !signatureAdded) {
        const signatureHeight = (doc.splitTextToSize(element.querySelector('.letterhead-input-field[placeholder="Signature (Your Name, Designation)"]')?.value || 'Your Name, Designation', contentWidth).length + 1) * baseLineHeight + 20;
        if (checkPageOverflow(signatureHeight) < 2) {
          addNewPage();
        }
        addSignature();
        signatureAdded = true;
      }

      if (line.isBreak) {
        yPosition += line.elementType === 'header' || line.elementType === 'subheader' ? headerSpacing : paragraphSpacing;
        continue;
      }

      if (isEmployeeDetails) {
        const pairs = line.employeeDetails;
        const columnWidth = contentWidth / 2 - 10;
        let pairIndex = 0;

        while (pairIndex < pairs.length) {
          const pairsToRender = pairs.slice(pairIndex, pairIndex + 2);
          const requiredHeight = baseLineHeight * Math.max(...pairsToRender.map(p => doc.splitTextToSize(`${p.label} ${p.value}`, columnWidth).length));
          linesFit = checkPageOverflow(requiredHeight);
          if (linesFit < 1) {
            addNewPage();
          }

          let xPosition = margin;
          pairsToRender.forEach(({ label, value }) => {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(0, 0, 0);
            const labelText = `${label}`;
            doc.text(labelText, xPosition, yPosition);
            const labelWidth = doc.getTextWidth(labelText);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(11);
            const valueText = value;
            const valueLines = doc.splitTextToSize(valueText, columnWidth - labelWidth - 5);
            doc.text(valueLines, xPosition + labelWidth + 5, yPosition);

            xPosition += columnWidth + 10;
          });

          yPosition += requiredHeight;
          pairIndex += 2;
        }
        yPosition += paragraphSpacing;
        continue;
      }

      if (isTable) {
        addNewPage();
        if (line.heading) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(14);
          doc.setTextColor(0, 0, 0);
          doc.text(line.heading, margin, yPosition);
          yPosition += baseLineHeight + paragraphSpacing;
        }

        const table = line.table;
        const rows = [];
        const thead = table.querySelector('thead');
        const tbody = table.querySelector('tbody');
        let headerRow = [];
        if (thead) {
          thead.querySelectorAll('tr').forEach((tr) => {
            const cells = [];
            tr.querySelectorAll('th').forEach((th) => {
              cells.push({ text: th.textContent.trim(), isHeader: true });
            });
            headerRow.push(cells);
          });
          rows.push(...headerRow);
        }
        if (tbody) {
          tbody.querySelectorAll('tr').forEach((tr) => {
            const cells = [];
            try {
              tr.querySelectorAll('td').forEach((td) => {
                const styles = {};
                if (td.querySelector('strong')) styles.bold = true;
                if (td.style.backgroundColor) styles.highlight = td.style.backgroundColor === 'rgb(255, 255, 0)' ? '#FFFF00' : td.style.backgroundColor;
                cells.push({ text: td.textContent.trim(), styles });
              });
            } catch (error) {
              console.error('Error parsing table cells:', error);
              const cellCount = tr.querySelectorAll('th').length || 3;
              for (let i = 0; i < cellCount; i++) {
                cells.push({ text: '', styles: {} });
              }
            }
            rows.push(cells);
          });
        }

        const colCount = Math.max(...rows.map(row => row.length));
        const colWidths = new Array(colCount).fill(0);
        const widthMultiplier = 1.2;
        rows.forEach(row => {
          row.forEach((cell, i) => {
            doc.setFont('helvetica', cell.isHeader || cell.styles?.bold ? 'bold' : 'normal');
            doc.setFontSize(11);
            const textWidth = doc.getTextWidth(cell.text || '');
            colWidths[i] = Math.max(colWidths[i], textWidth + 2 * tableCellPadding);
          });
        });
        for (let i = 0; i < colWidths.length; i++) {
          colWidths[i] *= widthMultiplier;
        }
        const totalTableWidth = colWidths.reduce((sum, width) => sum + width, 0);
        if (totalTableWidth > contentWidth) {
          const scaleFactor = contentWidth / totalTableWidth;
          colWidths.forEach((width, i) => {
            colWidths[i] = width * scaleFactor;
          });
        }

        let rowIndex = 0;
        while (rowIndex < rows.length) {
          const remainingSpace = pageHeight - yPosition - footerHeight;
          const rowsPerPage = Math.floor(remainingSpace / tableCellHeight);
          const rowsToRender = rows.slice(rowIndex, rowIndex + rowsPerPage);
          if (rowsToRender.length === 0 && rowIndex < rows.length) {
            addNewPage();
            if (line.heading) {
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(14);
              doc.setTextColor(0, 0, 0);
              doc.text(line.heading, margin, yPosition);
              yPosition += baseLineHeight + paragraphSpacing;
            }
            if (headerRow.length > 0) {
              let y = yPosition;
              headerRow.forEach((row) => {
                let x = margin;
                row.forEach((cell, cIndex) => {
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(11);
                  doc.setTextColor(0, 0, 0);
                  if (cell.styles?.highlight) {
                    doc.setFillColor(cell.styles.highlight);
                    doc.rect(x, y, colWidths[cIndex], tableCellHeight, 'F');
                  }
                  doc.setDrawColor(0, 0, 0);
                  doc.setLineWidth(tableBorderWidth);
                  doc.rect(x, y, colWidths[cIndex], tableCellHeight);
                  const textLines = doc.splitTextToSize(cell.text || '', colWidths[cIndex] - 2 * tableCellPadding);
                  doc.text(textLines, x + tableCellPadding, y + tableCellHeight - tableCellPadding);
                  x += colWidths[cIndex];
                });
                y += tableCellHeight;
              });
              yPosition = y;
            }
            continue;
          }

          let y = yPosition;
          rowsToRender.forEach((row) => {
            let x = margin;
            row.forEach((cell, cIndex) => {
              doc.setFont('helvetica', cell.isHeader || cell.styles?.bold ? 'bold' : 'normal');
              doc.setFontSize(11);
              doc.setTextColor(0, 0, 0);
              if (cell.styles?.highlight) {
                doc.setFillColor(cell.styles.highlight);
                doc.rect(x, y, colWidths[cIndex], tableCellHeight, 'F');
              }
              doc.setDrawColor(0, 0, 0);
              doc.setLineWidth(tableBorderWidth);
              doc.rect(x, y, colWidths[cIndex], tableCellHeight);
              const textLines = doc.splitTextToSize(cell.text || '', colWidths[cIndex] - 2 * tableCellPadding);
              doc.text(textLines, x + tableCellPadding, y + tableCellHeight - tableCellPadding);
              x += colWidths[cIndex];
            });
            y += tableCellHeight;
          });

          yPosition = y;
          rowIndex += rowsToRender.length;

          if (rowIndex < rows.length) {
            addNewPage();
            if (line.heading) {
              doc.setFont('helvetica', 'bold');
              doc.setFontSize(14);
              doc.setTextColor(0, 0, 0);
              doc.text(line.heading, margin, yPosition);
              yPosition += baseLineHeight + paragraphSpacing;
            }
            if (headerRow.length > 0) {
              let y = yPosition;
              headerRow.forEach((row) => {
                let x = margin;
                row.forEach((cell, cIndex) => {
                  doc.setFont('helvetica', 'bold');
                  doc.setFontSize(11);
                  doc.setTextColor(0, 0, 0);
                  if (cell.styles?.highlight) {
                    doc.setFillColor(cell.styles.highlight);
                    doc.rect(x, y, colWidths[cIndex], tableCellHeight, 'F');
                  }
                  doc.setDrawColor(0, 0, 0);
                  doc.setLineWidth(tableBorderWidth);
                  doc.rect(x, y, colWidths[cIndex], tableCellHeight);
                  const textLines = doc.splitTextToSize(cell.text || '', colWidths[cIndex] - 2 * tableCellPadding);
                  doc.text(textLines, x + tableCellPadding, y + tableCellHeight - tableCellPadding);
                  x += colWidths[cIndex];
                });
                y += tableCellHeight;
              });
              yPosition = y;
            }
          }
        }
        yPosition += paragraphSpacing;
        continue;
      }

      // Render text lines
      const maxFontSize = Math.max(...line.segments.map((segment) => segment.styles?.fontSize || 11));
      const lineHeightForSegment = maxFontSize <= 11 ? baseLineHeight : maxFontSize + 2;
      linesFit = checkPageOverflow(lineHeightForSegment);
      if (linesFit < 1) {
        addNewPage();
      }

      let xPosition = margin;
      let totalLineWidth = 0;

      for (const segment of line.segments) {
        if (!segment || !segment.text) {
          console.warn('Skipping invalid segment in width calculation:', segment);
          continue;
        }
        doc.setFont('helvetica', segment.styles?.bold ? 'bold' : segment.styles?.italic ? 'italic' : 'normal');
        if (segment.styles?.bold && segment.styles?.italic) {
          doc.setFont('helvetica', 'bolditalic');
        }
        doc.setFontSize(segment.styles?.fontSize || 11);
        doc.setTextColor(0, 0, 0);
        totalLineWidth += doc.getTextWidth(segment.text + ' ');
      }

      if (totalLineWidth > contentWidth) {
        let currentLineText = '';
        let currentLineWidth = 0;
        let segmentsInCurrentLine = [];

        for (const segment of line.segments) {
          if (!segment || !segment.text) {
            console.warn('Skipping invalid segment:', segment);
            continue;
          }
          doc.setFont('helvetica', segment.styles?.bold ? 'bold' : segment.styles?.italic ? 'italic' : 'normal');
          if (segment.styles?.bold && segment.styles?.italic) {
            doc.setFont('helvetica', 'bolditalic');
          }
          doc.setFontSize(segment.styles?.fontSize || 11);
          doc.setTextColor(0, 0, 0);
          const words = segment.text.split(' ');
          for (const word of words) {
            const wordWidth = doc.getTextWidth(word + ' ');
            if (currentLineWidth + wordWidth <= contentWidth) {
              currentLineText += (currentLineText ? ' ' : '') + word;
              currentLineWidth += wordWidth;
              segmentsInCurrentLine.push({ ...segment, currentText: word });
            } else {
              if (currentLineText) {
                let segmentX = margin;
                for (const segment of segmentsInCurrentLine) {
                  if (!segment || !segment.currentText) {
                    console.warn('Skipping invalid segment in rendering:', segment);
                    continue;
                  }
                  doc.setFont('helvetica', segment.styles?.bold ? 'bold' : segment.styles?.italic ? 'italic' : 'normal');
                  if (segment.styles?.bold && segment.styles?.italic) {
                    doc.setFont('helvetica', 'bolditalic');
                  }
                  doc.setFontSize(segment.styles?.fontSize || 11);
                  doc.setTextColor(0, 0, 0);
                  if (segment.styles?.highlight) {
                    doc.setFillColor(segment.styles.highlight);
                    const segWidth = doc.getTextWidth(segment.currentText);
                    doc.rect(segmentX, yPosition - (segment.styles?.fontSize || 11), segWidth, (segment.styles?.fontSize || 11) + 2, 'F');
                  }
                  doc.text(segment.currentText, segmentX, yPosition);
                  if (segment.styles?.underline) {
                    const textForWidth = segment.currentText + (segmentsInCurrentLine.indexOf(segment) < segmentsInCurrentLine.length - 1 ? ' ' : '');
                    const segWidth = doc.getTextWidth(textForWidth);
                    doc.setDrawColor(0, 0, 0);
                    doc.setLineWidth(0.5);
                    doc.setLineDash();
                    doc.line(segmentX, yPosition + 1, segmentX + segWidth, yPosition + 1);
                  }
                  segmentX += doc.getTextWidth(segment.currentText + ' ');
                }
                yPosition += lineHeightForSegment;
                linesFit = checkPageOverflow(lineHeightForSegment);
                if (linesFit < 1) {
                  addNewPage();
                }
              }
              currentLineText = word;
              currentLineWidth = wordWidth;
              segmentsInCurrentLine = [{ ...segment, currentText: word }];
            }
          }
        }

        if (currentLineText) {
          let segmentX = margin;
          for (const segment of segmentsInCurrentLine) {
            if (!segment || !segment.currentText) {
              console.warn('Skipping invalid segment in final rendering:', segment);
              continue;
            }
            doc.setFont('helvetica', segment.styles?.bold ? 'bold' : segment.styles?.italic ? 'italic' : 'normal');
            if (segment.styles?.bold && segment.styles?.italic) {
              doc.setFont('helvetica', 'bolditalic');
            }
            doc.setFontSize(segment.styles?.fontSize || 11);
            doc.setTextColor(0, 0, 0);
            if (segment.styles?.highlight) {
              doc.setFillColor(segment.styles.highlight);
              const segWidth = doc.getTextWidth(segment.currentText);
              doc.rect(segmentX, yPosition - (segment.styles?.fontSize || 11), segWidth, (segment.styles?.fontSize || 11) + 2, 'F');
            }
            doc.text(segment.currentText, segmentX, yPosition);
            if (segment.styles?.underline) {
              const segWidth = doc.getTextWidth(segment.currentText);
              doc.setDrawColor(0, 0, 0);
              doc.setLineWidth(0.5);
              doc.setLineDash();
              doc.line(segmentX, yPosition + 1, segmentX + segWidth, yPosition + 1);
            }
            segmentX += doc.getTextWidth(segment.currentText + ' ');
          }
          yPosition += lineHeightForSegment;
        }
      } else {
        let segmentX = margin;
        for (const segment of line.segments) {
          if (!segment || !segment.text) {
            console.warn('Skipping invalid segment in simple rendering:', segment);
            continue;
          }
          doc.setFont('helvetica', segment.styles?.bold ? 'bold' : segment.styles?.italic ? 'italic' : 'normal');
          if (segment.styles?.bold && segment.styles?.italic) {
            doc.setFont('helvetica', 'bolditalic');
          }
          doc.setFontSize(segment.styles?.fontSize || 11);
          doc.setTextColor(0, 0, 0);
          if (segment.styles?.highlight) {
            doc.setFillColor(segment.styles.highlight);
            const segWidth = doc.getTextWidth(segment.text);
            doc.rect(segmentX, yPosition - (segment.styles?.fontSize || 11), segWidth, (segment.styles?.fontSize || 11) + 2, 'F');
          }
          doc.text(segment.text, segmentX, yPosition);
          if (segment.styles?.underline) {
            const segWidth = doc.getTextWidth(segment.text);
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.5);
            doc.setLineDash();
            doc.line(segmentX, yPosition + 1, segmentX + segWidth, yPosition + 1);
          }
          segmentX += doc.getTextWidth(segment.text + ' ');
        }
        yPosition += lineHeightForSegment;
      }

      if (!isLastLine && !signatureAdded && (allLines[i + 1].table || allLines[i + 1].employeeDetails) && allLines.slice(i + 1).every(line => line.table || line.employeeDetails || line.isBreak)) {
        const signatureHeight = (doc.splitTextToSize(element.querySelector('.letterhead-input-field[placeholder="Signature (Your Name, Designation)"]')?.value || 'Your Name, Designation', contentWidth).length + 1) * baseLineHeight + 20;
        if (checkPageOverflow(signatureHeight) < 2) {
          addNewPage();
        }
        addSignature();
        signatureAdded = true;
      }
    }

    // Add signature at the end if not already added
    if (!signatureAdded) {
      const signatureHeight = (doc.splitTextToSize(element.querySelector('.letterhead-input-field[placeholder="Signature (Your Name, Designation)"]')?.value || 'Your Name, Designation', contentWidth).length + 1) * baseLineHeight + 20;
      if (checkPageOverflow(signatureHeight) < 2) {
        addNewPage();
      }
      addSignature();
    }

    // Add final footer
    addFooter(doc.getNumberOfPages(), doc.getNumberOfPages());

    if (preview) {
      return doc.output('blob');
    } else {
      doc.save(`${letterType.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`);
    }
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw error;
  }
};

export default generatePDF;