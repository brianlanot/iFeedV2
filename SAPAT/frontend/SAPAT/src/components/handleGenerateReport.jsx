import { RiFileChartLine } from 'react-icons/ri'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

const handleGenerateReport = async (customization, formulation, owner, shadowPrices, weight, ispercentcompute) => {
    // Create a new PDFDocument
    const pdfDoc = await PDFDocument.create()
    
    console.log("Weight in handleGenerateReport:", weight)
    
    // Embed fonts for better typography
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica)

    let page = pdfDoc.addPage([595.28, 841.89]) // A4 size
    const { width, height } = page.getSize()

    // Define colors
    const primaryColor = rgb(0.54296875, 0.26953125, 0.07421875) // Brown
    const secondaryColor = rgb(0.1, 0.4, 0.7) // Blue for section headers
    const textColor = rgb(0.2, 0.2, 0.2)
    const lightGray = rgb(0.9, 0.9, 0.9)

    // Define spacing and sizing
    const margin = 50
    // const contentWidth = width - (margin * 2)
    const titleFontSize = 20
    const headerFontSize = 14
    const subheaderFontSize = 12
    const bodyFontSize = 10
    const smallFontSize = 9
    const lineHeight = 18

    // Get customization values or use defaults
    const roundingPrecision = parseInt(customization.roundingPrecision) || 2
    const showEmptyValues = customization.showEmptyValues || false
    const additionalCosts = customization.additionalCosts || []
    const ingredientSorting = customization.ingredientSorting || 'alphabetical'
    const remarks = customization.remarks || ''

    // Sort ingredients according to customization
    let sortedIngredients = [...formulation.ingredients]

    switch (ingredientSorting) {
      case 'alphabetical':
        sortedIngredients.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
        break
      case 'valueHighToLow':
        sortedIngredients.sort((a, b) => b.value - a.value)
        break
      case 'valueLowToHigh':
        sortedIngredients.sort((a, b) => a.value - b.value)
        break
      case 'costHighToLow':
        sortedIngredients.sort((a, b) => (b.cost || 0) - (a.cost || 0))
        break
      case 'costLowToHigh':
        sortedIngredients.sort((a, b) => (a.cost || 0) - (b.cost || 0))
        break
      default:
        // Default to alphabetical
        sortedIngredients.sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    }

    console.log("Ingredients before filter:", sortedIngredients)
    console.log("showEmptyValues:", showEmptyValues)
    // Filter out empty values if specified
    if (!showEmptyValues) {
      sortedIngredients = sortedIngredients.filter(ing => ing.value > 0)
    }

    // Add logo image instead of placeholder rectangle
    try {
      // Fetch the logo image
      const logoResponse = await fetch('/assets/logo.png')
      const logoImageData = await logoResponse.arrayBuffer()

      // Embed the image in the PDF
      const logoImage = await pdfDoc.embedPng(logoImageData)
      const logoDims = logoImage.scale(0.010)

      // Draw the logo
      page.drawImage(logoImage, {
        x: margin,
        y: height - margin - logoDims.height,
        width: logoDims.width,
        height: logoDims.height,
      })
    } catch (error) {
      console.error('Error adding logo:', error)

      // Fallback to rectangle if image loading fails
      page.drawRectangle({
        x: margin,
        y: height - margin - 40,
        width: 30,
        height: 30,
        color: primaryColor,
      })
    }

    // Add company name beside logo
    page.drawText('iFEED v2', {
      x: margin + 40,
      y: height - margin - 25,
      size: 16,
      font: timesRomanBold,
      color: primaryColor,
    })

    // Add report generation date
    const today = new Date()
    const formattedDate = today
      .toLocaleDateString('en-US', {
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      })
      .replace(/\//g, '/')

    page.drawText(`Report generated on: ${formattedDate}`, {
      x: width - margin - 180,
      y: height - margin - 25,
      size: smallFontSize,
      font: helvetica,
      color: textColor,
    })

    // Add horizontal rule
    page.drawLine({
      start: { x: margin, y: height - margin - 50 },
      end: { x: width - margin, y: height - margin - 50 },
      thickness: 1,
      color: lightGray,
    })

    // Report Title
    let yPosition = height - margin - 80
    page.drawText(`Feed Formulation Report`, {
      x: margin,
      y: yPosition,
      size: titleFontSize,
      font: timesRomanBold,
      color: primaryColor,
    })

    // Formulation Details Section
    yPosition -= 40
    page.drawText(`Formulation Details`, {
      x: margin,
      y: yPosition,
      size: headerFontSize,
      font: timesRomanBold,
      color: secondaryColor,
    })

    // Draw info fields with clear alignment
    yPosition -= 25
    const labelX = margin
    const detailX = margin + 120
    const fieldSpacing = 18

    // Calculate total cost including additionalCosts
    let totalCost = formulation.cost || 0
    additionalCosts.forEach(cost => {
      totalCost += cost.value
    })

    const fieldData = [
      { label: 'Code:', value: formulation.code },
      { label: 'Name:', value: formulation.name },
      { label: 'Description:', value: formulation.description },
      { label: 'Animal Group:', value: formulation.animal_group },
      { label: 'Created by:', value: owner.displayName || 'N/A' },
      { label: 'Total Cost:', value: `PHP ${totalCost.toFixed(roundingPrecision)/1000} per ${formulation.weight}kg` },
    ]
    // console.log("Ingredients Present here ", Ingredients)

    fieldData.forEach((field) => {
      page.drawText(field.label, {
        x: labelX,
        y: yPosition,
        size: subheaderFontSize,
        font: timesRomanBold,
        color: textColor,
      })

      page.drawText(field.value, {
        x: detailX,
        y: yPosition,
        size: subheaderFontSize,
        font: timesRomanFont,
        color: textColor,
      })

      yPosition -= fieldSpacing
    })

    // Additional Costs section (if any)
    if (additionalCosts.length > 0) {
      yPosition -= 10
      page.drawText('Additional Costs:', {
        x: labelX,
        y: yPosition,
        size: subheaderFontSize,
        font: timesRomanBold,
        color: textColor,
      })

      yPosition -= fieldSpacing

      additionalCosts.forEach(cost => {
        page.drawText(`${cost.name}:`, {
          x: labelX + 20,
          y: yPosition,
          size: bodyFontSize,
          font: timesRomanFont,
          color: textColor,
        })

        page.drawText(`PHP ${cost.value.toFixed(roundingPrecision)}`, {
          x: detailX,
          y: yPosition,
          size: bodyFontSize,
          font: timesRomanFont,
          color: textColor,
        })

        yPosition -= fieldSpacing
      })
    }

    // Ingredients Section
    yPosition -= 15
    page.drawText(`Ingredients`, {
      x: margin,
      y: yPosition,
      size: headerFontSize,
      font: timesRomanBold,
      color: secondaryColor,
    })

    // Show ingredients sorting method
    let sortingText = "Sorting: "
    switch (ingredientSorting) {
      case 'alphabetical': sortingText += "Alphabetical"; break;
      case 'valueHighToLow': sortingText += "Value (High to Low)"; break;
      case 'valueLowToHigh': sortingText += "Value (Low to High)"; break;
      case 'costHighToLow': sortingText += "Cost (High to Low)"; break;
      case 'costLowToHigh': sortingText += "Cost (Low to High)"; break;
    }

    page.drawText(sortingText, {
      x: margin + 180,
      y: yPosition,
      size: smallFontSize,
      font: helvetica,
      color: textColor,
    })

    yPosition -= 25

    // Draw ingredients table with proper column alignment
    const nameColWidth = 180
    const minColWidth = 50
    const maxColWidth = 50
    const valColWidth = 50

    // Column positions
    const nameX = margin
    const minX = nameX + nameColWidth
    const maxX = minX + minColWidth
    const valX = maxX + maxColWidth

    // Draw header
    page.drawText('Ingredient Name', {
      x: nameX,
      y: yPosition,
      size: subheaderFontSize,
      font: timesRomanBold,
      color: secondaryColor,
    })

    // page.drawText('Min', {
    //   x: minX,
    //   y: yPosition,
    //   size: subheaderFontSize,
    //   font: timesRomanBold,
    //   color: secondaryColor,
    // })
    //
    // page.drawText('Max', {
    //   x: maxX,
    //   y: yPosition,
    //   size: subheaderFontSize,
    //   font: timesRomanBold,
    //   color: secondaryColor,
    // })

    page.drawText('Value', {
      x: valX,
      y: yPosition,
      size: subheaderFontSize,
      font: timesRomanBold,
      color: secondaryColor,
    })

    yPosition -= 15

    // Draw a line under headers
    page.drawLine({
      start: { x: margin, y: yPosition + 5 },
      end: {
        x: margin + nameColWidth + minColWidth + maxColWidth + valColWidth,
        y: yPosition + 5,
      },
      thickness: 0.5,
      color: lightGray,
    })

    yPosition -= 5

    // Draw ingredients rows (using sorted ingredients)
    console.log(sortedIngredients, "SORTED INGREDIENTS HERE")
    sortedIngredients.forEach((ing) => {
      console.log("Drawing ingredient:", ing.name, "at yPosition:", yPosition)
      page.drawText(ing.name, {
        x: nameX,
        y: yPosition,
        size: bodyFontSize,
        font: timesRomanFont,
        color: textColor,
      })

      // page.drawText(ing.minimum?.toString() || 'N/A', {
      //   x: minX,
      //   y: yPosition,
      //   size: bodyFontSize,
      //   font: timesRomanFont,
      //   color: textColor,
      // })
      //
      // page.drawText(ing.maximum.toString() || 'N/A', {
      //   x: maxX,
      //   y: yPosition,
      //   size: bodyFontSize,
      //   font: timesRomanFont,
      //   color: textColor,
      // })

    if (ispercentcompute === false) {

      page.drawText((ing.value).toFixed(roundingPrecision).toString() + " kilograms", {
        x: valX,
        y: yPosition,
        size: bodyFontSize,
        font: timesRomanFont,
        color: textColor,
      })
    } else {
      page.drawText((ing.value).toFixed(roundingPrecision).toString() + " %", {
        x: valX,
        y: yPosition,
        size: bodyFontSize,
        font: timesRomanFont,
        color: textColor,
      })
    }

      yPosition -= lineHeight

      // Check if we need a new page
      if (yPosition < margin + 100) {
        page = pdfDoc.addPage([595.28, 841.89])
        yPosition = height - margin - 50
      }
    })

    // Nutrients Section
    yPosition -= 15
    page.drawText(`Nutrients`, {
      x: margin,
      y: yPosition,
      size: headerFontSize,
      font: timesRomanBold,
      color: secondaryColor,
    })

    yPosition -= 25

    // Draw nutrients table headers
    page.drawText('Nutrient', {
      x: nameX,
      y: yPosition,
      size: subheaderFontSize,
      font: timesRomanBold,
      color: secondaryColor,
    })

    // page.drawText('Min', {
    //   x: minX,
    //   y: yPosition,
    //   size: subheaderFontSize,
    //   font: timesRomanBold,
    //   color: secondaryColor,
    // })
    //
    // page.drawText('Max', {
    //   x: maxX,
    //   y: yPosition,
    //   size: subheaderFontSize,
    //   font: timesRomanBold,
    //   color: secondaryColor,
    // })

    page.drawText('Value', {
      x: valX,
      y: yPosition,
      size: subheaderFontSize,
      font: timesRomanBold,
      color: secondaryColor,
    })

    yPosition -= 15

    // Draw a line under headers
    page.drawLine({
      start: { x: margin, y: yPosition + 5 },
      end: {
        x: margin + nameColWidth + minColWidth + maxColWidth + valColWidth,
        y: yPosition + 5,
      },
      thickness: 0.5,
      color: lightGray,
    })

    yPosition -= 5

    // Filter nutrients if needed
    let displayNutrients = [...formulation.nutrients]
    console.log("NUTRIENTS HERE", displayNutrients)
    if (!showEmptyValues) {
      displayNutrients = displayNutrients.filter(nutrient => nutrient.value > 0)
    }

    // Draw nutrients rows
    displayNutrients.forEach((nutrient) => {
      page.drawText(nutrient.name, {
        x: nameX,
        y: yPosition,
        size: bodyFontSize,
        font: timesRomanFont,
        color: textColor,
      })

      // page.drawText(nutrient.minimum.toString() || 'N/A', {
      //   x: minX,
      //   y: yPosition,
      //   size: bodyFontSize,
      //   font: timesRomanFont,
      //   color: textColor,
      // })
      //
      // page.drawText(nutrient.maximum.toString() || 'N/A', {
      //   x: maxX,
      //   y: yPosition,
      //   size: bodyFontSize,
      //   font: timesRomanFont,
      //   color: textColor,
      // })

      if(ispercentcompute ===false){
        if (nutrient.name === "Total Digestible Nutrients" || nutrient.name ==="Dry Matter") {
          page.drawText(
          ((nutrient.value/1000).toFixed(roundingPrecision)).toString() + " kilograms", {
          x: valX,
          y: yPosition,
          size: bodyFontSize,
          font: timesRomanFont,
          color: textColor,
          })
        } else {
          page.drawText(
          nutrient.value.toFixed(roundingPrecision).toString() + " grams", {
          x: valX,
          y: yPosition,
          size: bodyFontSize,
          font: timesRomanFont,
          color: textColor,
          })
        }
    } else {
      page.drawText(
        ((nutrient.value / (formulation.weight * 1000))*100).toFixed(roundingPrecision).toString() + " %", {
        x: valX,
        y: yPosition,
        size: bodyFontSize,
        font: timesRomanFont,
        color: textColor,
        })
    }
      

      yPosition -= lineHeight

      // Check if we need a new page
      if (yPosition < margin + 100) {
        page = pdfDoc.addPage([595.28, 841.89])
        yPosition = height - margin - 50
      }
    })

    // // ==============================================================================
    // // ADDED IN PRACTICUM
    // Add Shadow Prices section (only if available)
    // Filter shadow prices the same way as in ShadowPricingTab
    const filteredShadowPrices = shadowPrices.filter(
      row => row.constraint !== "Total Ratio" && !row.constraint.includes("Ratio:")
    );

    if (filteredShadowPrices.length > 0) {
      // Section separation and page break logic
      const comfortableThreshold = 120;
      if (yPosition < margin + comfortableThreshold) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = height - margin - 50;
      } else {
        yPosition -= 30; // Gap before Shadow Prices section (if on same page)
      }

      // Section header
      page.drawText('Shadow Prices', {
        x: margin,
        y: yPosition,
        size: headerFontSize,
        font: timesRomanBold,
        color: secondaryColor,
      });

      yPosition -= 15; // Gap after header

      // Word-wrap explanation paragraph using actual PDF width
      const explanationText = "Shadow prices show how much the feed cost would go up or down if you change a nutrient requirement (like protein or calcium) just a little. If the shadow price is high, it means that nutrient is expensive to meet. If it’s low or zero, that nutrient is easy to meet and doesn’t affect the cost much.";
      const availableWidth = width - 2 * margin;
      function pdfWordWrap(text, font, fontSize, maxWidth) {
        const words = text.split(' ');
        let lines = [];
        let currentLine = '';
        for (let word of words) {
          const testLine = currentLine.length > 0 ? currentLine + ' ' + word : word;
          const testLineWidth = font.widthOfTextAtSize(testLine, fontSize);
          if (testLineWidth > maxWidth && currentLine.length > 0) {
            lines.push(currentLine);
            currentLine = word;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine.length > 0) lines.push(currentLine);
        return lines;
      }
      const explanationLines = pdfWordWrap(explanationText, timesRomanFont, bodyFontSize, availableWidth);

      // Estimate the height needed for the header + paragraph only
      const estimatedHeaderParaHeight =
        15 + // header
        explanationLines.length * (lineHeight - 2) + // paragraph
        6; // gap after paragraph
      if (yPosition < margin + estimatedHeaderParaHeight) {
        page = pdfDoc.addPage([595.28, 841.89]);
        yPosition = height - margin - 50;
      }

      explanationLines.forEach(line => {
        page.drawText(line, {
          x: margin,
          y: yPosition,
          size: bodyFontSize,
          font: timesRomanFont,
          color: textColor,
        });
        yPosition -= (lineHeight - 2); // Tighter line spacing
      });

      yPosition -= 6; // Gap after explanation

      // Table headers
      page.drawText('Constraint', {
        x: nameX,
        y: yPosition,
        size: subheaderFontSize,
        font: timesRomanBold,
        color: secondaryColor,
      });
      page.drawText('Shadow Price', {
        x: valX,
        y: yPosition,
        size: subheaderFontSize,
        font: timesRomanBold,
        color: secondaryColor,
      });
      yPosition -= 13;
      // Draw a line under headers
      page.drawLine({
        start: { x: margin, y: yPosition + 5 },
        end: {
          x: margin + nameColWidth + minColWidth + maxColWidth + valColWidth,
          y: yPosition + 5,
        },
        thickness: 0.5,
        color: lightGray,
      });
      yPosition -= 5;
      // Table rows
      filteredShadowPrices.forEach((row) => {
        page.drawText(row.constraint, {
          x: nameX,
          y: yPosition,
          size: bodyFontSize,
          font: timesRomanFont,
          color: textColor,
        });
        page.drawText(row.shadowPrice.toFixed(roundingPrecision).toString(), {
          x: valX,
          y: yPosition,
          size: bodyFontSize,
          font: timesRomanFont,
          color: textColor,
        });
        yPosition -= lineHeight;
        // Check if we need a new page
        if (yPosition < margin + 100) {
          page = pdfDoc.addPage([595.28, 841.89]);
          yPosition = height - margin - 50;
        }
      });
      yPosition -= 5; // Gap after table
    }

    // ==============================================================================

    // Add remarks if provided
    if (remarks.trim()) {
      // Check if we need a new page for remarks
      if (yPosition < margin + 150) {
        page = pdfDoc.addPage([595.28, 841.89])
        yPosition = height - margin - 50
      }

      yPosition -= 25
      page.drawText('Remarks:', {
        x: margin,
        y: yPosition,
        size: headerFontSize,
        font: timesRomanBold,
        color: secondaryColor,
      })

      yPosition -= 20

      // Split remarks into lines if too long
      const maxCharsPerLine = 70
      let remainingRemarks = remarks
      while (remainingRemarks.length > 0) {
        const currentLine = remainingRemarks.length > maxCharsPerLine
          ? remainingRemarks.substring(0, maxCharsPerLine)
          : remainingRemarks

        page.drawText(currentLine, {
          x: margin,
          y: yPosition,
          size: bodyFontSize,
          font: timesRomanFont,
          color: textColor,
        })

        yPosition -= lineHeight
        remainingRemarks = remainingRemarks.substring(currentLine.length)

        // Check if we need a new page
        if (yPosition < margin + 50 && remainingRemarks.length > 0) {
          page = pdfDoc.addPage([595.28, 841.89])
          yPosition = height - margin - 50
        }
      }
    }

    // Add footer with page number
    const totalPages = pdfDoc.getPageCount()
    for (let i = 0; i < totalPages; i++) {
      const page = pdfDoc.getPage(i)
      // const { height } = page.getSize();

      page.drawText(`Page ${i + 1} of ${totalPages}`, {
        x: width / 2 - 40,
        y: margin / 2,
        size: smallFontSize,
        font: helvetica,
        color: textColor,
      })

      // Add footer divider
      page.drawLine({
        start: { x: margin, y: margin },
        end: { x: width - margin, y: margin },
        thickness: 0.5,
        color: lightGray,
      })
    }

    // Serialize the PDFDocument to bytes (a Uint8Array)
    const pdfBytes = await pdfDoc.save()

    // Create a Blob from the PDF bytes
    const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' })

    // Create a download link and trigger the download
    const link = document.createElement('a')
    link.href = URL.createObjectURL(pdfBlob)
    link.download = `${formulation.name} - Feed Formulation Report.pdf`
    link.click()
  }


  export default handleGenerateReport;