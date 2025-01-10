const PDF_STYLES = {
  title: { fontSize: 24, fontStyle: 'bold', textColor: [0, 73, 47] },
  weekHeader: { fontSize: 18, fontStyle: 'bold', textColor: [0, 73, 47] },
  sessionHeader: { fontSize: 12, fontStyle: 'bold', textColor: [0, 73, 47] },
  normalText: { fontSize: 11, textColor: [0, 0, 0] },
  highlightText: { fontSize: 11, textColor: [41, 128, 185] },
  bulletPoint: '•  ',
  margin: 10,
  lineHeight: 7,
};

class TrainingPlanPDF {
  constructor() {
    this.doc = new window.jspdf.jsPDF();
    this.pageHeight = this.doc.internal.pageSize.height;
    this.pageWidth = this.doc.internal.pageSize.width;
    this.yOffset = 20;
  }

  applyStyle(style) {
    this.doc.setFontSize(style.fontSize);
    if (style.fontStyle) this.doc.setFont(undefined, style.fontStyle);
    if (style.textColor) this.doc.setTextColor(...style.textColor);
  }

  addStyledText(text, x, y, maxWidth, style) {
    this.applyStyle(style);
    const lines = this.doc.splitTextToSize(text, maxWidth);
    lines.forEach((line) => {
      if (y > this.pageHeight - PDF_STYLES.margin) {
        this.doc.addPage();
        y = 20;
      }
      this.doc.text(line, x, y);
      y += PDF_STYLES.lineHeight;
    });
    return y;
  }

  addOverview(overview) {
    // Title
    this.applyStyle(PDF_STYLES.title);
    this.doc.text('Training Plan', PDF_STYLES.margin, this.yOffset);
    this.yOffset += PDF_STYLES.lineHeight * 2;

    // Plan title
    const title = overview.querySelector('h3').innerText;
    this.yOffset = this.addStyledText(
      title,
      PDF_STYLES.margin,
      this.yOffset,
      this.pageWidth - PDF_STYLES.margin * 2,
      PDF_STYLES.weekHeader
    );
    this.yOffset += PDF_STYLES.lineHeight;

    // Focus and description
    const focus = overview.querySelector('.plan-focus').innerText;
    this.yOffset = this.addStyledText(
      focus,
      PDF_STYLES.margin,
      this.yOffset,
      this.pageWidth - PDF_STYLES.margin * 2,
      PDF_STYLES.highlightText
    );
    this.yOffset += PDF_STYLES.lineHeight;

    const description = overview.querySelector('.plan-description').innerText;
    this.yOffset = this.addStyledText(
      description,
      PDF_STYLES.margin,
      this.yOffset,
      this.pageWidth - PDF_STYLES.margin * 2,
      PDF_STYLES.normalText
    );
    this.yOffset += PDF_STYLES.lineHeight;

    // Highlights with bullets
    const highlights = overview.querySelector('.plan-highlights');
    if (highlights) {
      const highlightItems = highlights.querySelectorAll('li');
      highlightItems.forEach((item) => {
        this.yOffset = this.addStyledText(
          `${PDF_STYLES.bulletPoint}${item.innerText}`,
          PDF_STYLES.margin,
          this.yOffset,
          this.pageWidth - PDF_STYLES.margin * 2,
          PDF_STYLES.normalText
        );
      });
      this.yOffset += PDF_STYLES.lineHeight;
    }
  }

  addWeek(week) {
    this.doc.addPage();
    this.yOffset = 20;

    // Week header
    const weekHeader = week.querySelector('.week-header').innerText;
    this.yOffset = this.addStyledText(
      weekHeader,
      PDF_STYLES.margin,
      this.yOffset,
      this.pageWidth - PDF_STYLES.margin * 2,
      PDF_STYLES.weekHeader
    );
    this.yOffset += PDF_STYLES.lineHeight;

    // Sessions
    const sessions = week.querySelectorAll('.session');
    sessions.forEach((session) => {
      // Session header
      const sessionHeader = session.querySelector('.session-header').innerText;
      this.yOffset = this.addStyledText(
        sessionHeader,
        PDF_STYLES.margin,
        this.yOffset,
        this.pageWidth - PDF_STYLES.margin * 2,
        PDF_STYLES.sessionHeader
      );

      // Session details
      const sessionDescription = session.querySelector('.session-details p');
      if (sessionDescription) {
        this.yOffset = this.addStyledText(
          sessionDescription.innerText,
          PDF_STYLES.margin + 5,
          this.yOffset,
          this.pageWidth - (PDF_STYLES.margin * 2 + 5),
          PDF_STYLES.normalText
        );
        this.yOffset; // Reduced spacing before specs
      }

      // Workout specs
      const specs = session.querySelectorAll('.workout-specs li');
      specs.forEach((spec) => {
        this.yOffset = this.addStyledText(
          spec.innerText,
          PDF_STYLES.margin + 5,
          this.yOffset,
          this.pageWidth - (PDF_STYLES.margin * 2 + 5),
          PDF_STYLES.normalText
        );
      });

      this.yOffset += PDF_STYLES.lineHeight; // Normal spacing after the entire session

      if (this.yOffset > this.pageHeight - PDF_STYLES.margin * 2) {
        this.doc.addPage();
        this.yOffset = 20;
      }
    });
  }

  addPageNumbers() {
    const pageCount = this.doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.applyStyle(PDF_STYLES.normalText);
      this.doc.text(
        `Page ${i} of ${pageCount}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      );
    }
  }

  generatePDF() {
    const overview = document.querySelector('.plan-overview');
    const weeks = document.querySelectorAll('.week-container');

    // Add overview to first page
    if (overview) {
      this.addOverview(overview);
    }

    // Add each week on a new page
    weeks.forEach((week) => {
      this.addWeek(week);
    });

    // Add page numbers
    this.addPageNumbers();

    // Save the PDF
    this.doc.save('training_plan.pdf');
  }
}

export const exportToPDF = () => {
  const pdfExporter = new TrainingPlanPDF();
  pdfExporter.generatePDF();
};
