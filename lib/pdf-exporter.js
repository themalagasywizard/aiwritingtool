/**
 * PDF Export functionality for AIStoryCraft
 * This file contains functions to export a project or chapter to PDF
 * Uses jsPDF and html2canvas libraries
 */

// Function to export the current chapter or entire project to PDF
export async function exportToPdf(options = {}) {
  const {
    exportEntireProject = false,
    filename = 'story-export.pdf',
    includeChapterTitles = true,
    includeMetadata = true,
    pageSize = 'a4',
    margins = {
      top: 20,
      right: 20,
      bottom: 20,
      left: 20
    }
  } = options;

  // Check if required libraries are loaded
  if (typeof jspdf === 'undefined' || typeof html2canvas === 'undefined') {
    await loadDependencies();
  }

  try {
    // Show loading indicator
    showLoading('Generating PDF...');

    // Create a new jsPDF instance
    const pdf = new jspdf.jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: pageSize
    });

    // Set up PDF document properties
    setupPdfDocument(pdf);

    if (exportEntireProject) {
      // Export all chapters
      await exportProject(pdf, includeChapterTitles, includeMetadata, margins);
    } else {
      // Export only current chapter
      await exportCurrentChapter(pdf, includeChapterTitles, includeMetadata, margins);
    }

    // Save the PDF
    pdf.save(filename);

    // Hide loading indicator
    hideLoading();

    // Show success message
    showToast('PDF exported successfully!', 'success');
  } catch (error) {
    console.error('Error exporting PDF:', error);
    hideLoading();
    showToast('Failed to export PDF: ' + error.message, 'error');
  }
}

// Load required libraries dynamically
async function loadDependencies() {
  console.log('Loading PDF export dependencies...');
  
  return new Promise((resolve, reject) => {
    // Load jsPDF if not already loaded
    if (typeof jspdf === 'undefined') {
      const jsPdfScript = document.createElement('script');
      jsPdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      jsPdfScript.onload = () => console.log('jsPDF loaded');
      jsPdfScript.onerror = () => reject(new Error('Failed to load jsPDF'));
      document.head.appendChild(jsPdfScript);
    }

    // Load html2canvas if not already loaded
    if (typeof html2canvas === 'undefined') {
      const html2canvasScript = document.createElement('script');
      html2canvasScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      html2canvasScript.onload = () => console.log('html2canvas loaded');
      html2canvasScript.onerror = () => reject(new Error('Failed to load html2canvas'));
      document.head.appendChild(html2canvasScript);
    }

    // Check if both libraries are loaded every 100ms
    const checkInterval = setInterval(() => {
      if (typeof jspdf !== 'undefined' && typeof html2canvas !== 'undefined') {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);

    // Set a timeout in case the libraries fail to load
    setTimeout(() => {
      clearInterval(checkInterval);
      reject(new Error('Timed out while loading dependencies'));
    }, 10000);
  });
}

// Setup PDF document properties
function setupPdfDocument(pdf) {
  // Get project title from app state
  const projectTitle = window.appState?.currentProject?.title || 'Story';
  const author = window.appState?.currentUser?.email?.split('@')[0] || 'Author';

  // Set document properties
  pdf.setProperties({
    title: projectTitle,
    author: author,
    subject: 'Story Export from AIStoryCraft',
    keywords: 'story, writing, AIStoryCraft',
    creator: 'AIStoryCraft'
  });

  // Set default font
  pdf.setFont('Helvetica', 'normal');
}

// Export the current chapter
async function exportCurrentChapter(pdf, includeChapterTitles, includeMetadata, margins) {
  // Get current chapter
  const currentChapter = window.appState?.currentChapter;
  if (!currentChapter) {
    throw new Error('No chapter is currently selected');
  }

  // Add chapter to PDF
  await addChapterToPdf(pdf, currentChapter, includeChapterTitles, includeMetadata, margins, 1);
}

// Export all chapters of the project
async function exportProject(pdf, includeChapterTitles, includeMetadata, margins) {
  // Get project
  const project = window.appState?.currentProject;
  if (!project) {
    throw new Error('No project is currently loaded');
  }

  // Get all chapters from the cache or load them
  let allChapters = [];
  
  // First try to get from chaptersList in the DOM
  const chaptersList = document.getElementById('chaptersList');
  if (chaptersList) {
    const chapterElements = chaptersList.querySelectorAll('.chapter-item');
    
    // For each element, get the chapter ID and look up in the cache
    for (const element of chapterElements) {
      const chapterId = element.getAttribute('data-chapter-id');
      if (chapterId && window.appState?.chapterCache?.has(chapterId)) {
        allChapters.push(window.appState.chapterCache.get(chapterId));
      }
    }
  }
  
  // If chapters are not in cache, try to fetch them
  if (allChapters.length === 0) {
    try {
      const { chapters } = window.supabaseServices || {};
      if (chapters) {
        const { data, error } = await chapters.getByProject(project.id);
        if (error) throw error;
        if (data) {
          allChapters = data.sort((a, b) => a.order_index - b.order_index);
        }
      } else {
        throw new Error('Chapters service not available');
      }
    } catch (error) {
      console.error('Error fetching chapters:', error);
      throw new Error('Failed to fetch chapters for export');
    }
  }
  
  if (allChapters.length === 0) {
    throw new Error('No chapters found to export');
  }
  
  // Add metadata page with project info
  if (includeMetadata) {
    addProjectMetadataToPdf(pdf, project, allChapters.length, margins);
    pdf.addPage();
  }
  
  // Add each chapter to the PDF
  for (let i = 0; i < allChapters.length; i++) {
    await addChapterToPdf(pdf, allChapters[i], includeChapterTitles, includeMetadata, margins, i + 1);
    
    // Add page break between chapters if not the last chapter
    if (i < allChapters.length - 1) {
      pdf.addPage();
    }
  }
}

// Add project metadata to PDF
function addProjectMetadataToPdf(pdf, project, chapterCount, margins) {
  const { top, left } = margins;
  
  // Add title
  pdf.setFontSize(24);
  pdf.setFont('Helvetica', 'bold');
  pdf.text(project.title, left, top + 10);
  
  // Add horizontal line
  pdf.setDrawColor(0, 0, 0);
  pdf.setLineWidth(0.5);
  pdf.line(left, top + 15, pdf.internal.pageSize.width - margins.right, top + 15);
  
  // Add project metadata
  pdf.setFontSize(12);
  pdf.setFont('Helvetica', 'normal');
  
  let y = top + 25;
  
  // Description
  if (project.description) {
    pdf.setFont('Helvetica', 'bold');
    pdf.text('Description:', left, y);
    pdf.setFont('Helvetica', 'normal');
    
    // Split description into multiple lines if needed
    const descriptionLines = pdf.splitTextToSize(
      project.description, 
      pdf.internal.pageSize.width - margins.left - margins.right
    );
    
    pdf.text(descriptionLines, left, y + 6);
    y += 10 + (descriptionLines.length * 6);
  }
  
  // Creation and update dates
  pdf.setFont('Helvetica', 'bold');
  pdf.text('Created:', left, y);
  pdf.setFont('Helvetica', 'normal');
  pdf.text(formatDate(project.created_at), left + 20, y);
  
  y += 6;
  pdf.setFont('Helvetica', 'bold');
  pdf.text('Last Updated:', left, y);
  pdf.setFont('Helvetica', 'normal');
  pdf.text(formatDate(project.updated_at), left + 30, y);
  
  y += 10;
  pdf.setFont('Helvetica', 'bold');
  pdf.text('Chapters:', left, y);
  pdf.setFont('Helvetica', 'normal');
  pdf.text(chapterCount.toString(), left + 22, y);
}

// Add a chapter to the PDF
async function addChapterToPdf(pdf, chapter, includeChapterTitle, includeMetadata, margins, chapterNumber) {
  const { top, right, bottom, left } = margins;
  
  // Add chapter title if requested
  let currentY = top;
  
  if (includeChapterTitle) {
    pdf.setFontSize(18);
    pdf.setFont('Helvetica', 'bold');
    
    // Add chapter number and title
    const title = `Chapter ${chapterNumber}: ${chapter.title}`;
    pdf.text(title, left, currentY);
    
    currentY += 10;
    
    // Add thin line under title
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.3);
    pdf.line(left, currentY, pdf.internal.pageSize.width - right, currentY);
    
    currentY += 10;
  }
  
  // Create a temporary div to hold the chapter content
  const tempDiv = document.createElement('div');
  tempDiv.style.fontFamily = 'Merriweather, serif';
  tempDiv.style.lineHeight = '1.6';
  tempDiv.style.padding = '20px';
  tempDiv.style.width = '595px'; // A4 width in pixels
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.top = '-9999px';
  tempDiv.innerHTML = chapter.content || '';
  
  // Append to body
  document.body.appendChild(tempDiv);
  
  // Use html2canvas to render the content
  try {
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      logging: false,
      useCORS: true
    });
    
    // Convert canvas to image
    const imgData = canvas.toDataURL('image/jpeg', 0.95);
    
    // Calculate proper scale to fit within margins
    const availableWidth = pdf.internal.pageSize.width - left - right;
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = imgWidth / imgHeight;
    
    let pdfWidth = availableWidth;
    let pdfHeight = pdfWidth / ratio;
    
    // Check if the image is taller than available space
    const maxHeight = pdf.internal.pageSize.height - currentY - bottom;
    
    if (pdfHeight > maxHeight) {
      // Content is too tall, need to split across multiple pages
      let remainingHeight = imgHeight;
      let srcY = 0;
      
      while (remainingHeight > 0) {
        const availableHeight = pdf.internal.pageSize.height - currentY - bottom;
        const pageCanvasHeight = (availableHeight / pdfHeight) * imgHeight;
        
        // Add a slice of the image to the PDF
        pdf.addImage(
          imgData,
          'JPEG',
          left,
          currentY,
          pdfWidth,
          availableHeight,
          `chapter${chapterNumber}_${srcY}`, // Unique reference for each slice
          'SLOW',
          90
        );
        
        srcY += pageCanvasHeight;
        remainingHeight -= pageCanvasHeight;
        
        // If there's more content, add a new page
        if (remainingHeight > 0) {
          pdf.addPage();
          currentY = top;
        }
      }
    } else {
      // Content fits on one page
      pdf.addImage(
        imgData,
        'JPEG',
        left,
        currentY,
        pdfWidth,
        pdfHeight,
        `chapter${chapterNumber}`,
        'SLOW',
        90
      );
    }
  } finally {
    // Clean up
    document.body.removeChild(tempDiv);
  }
}

// Format date for display
function formatDate(dateString) {
  if (!dateString) return 'Unknown';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Show loading indicator
function showLoading(message) {
  const loadingOverlay = document.getElementById('loadingOverlay');
  const loadingMessage = document.getElementById('loadingMessage');
  
  if (loadingOverlay && loadingMessage) {
    loadingMessage.textContent = message;
    loadingOverlay.classList.remove('hidden');
    loadingOverlay.classList.add('flex');
  }
}

// Hide loading indicator
function hideLoading() {
  const loadingOverlay = document.getElementById('loadingOverlay');
  
  if (loadingOverlay) {
    loadingOverlay.classList.add('hidden');
    loadingOverlay.classList.remove('flex');
  }
}

// Show toast notification
function showToast(message, type = 'success') {
  const toast = document.getElementById('aiToast');
  
  if (toast) {
    const toastText = toast.querySelector('p');
    if (toastText) toastText.textContent = message;
    
    toast.classList.remove('hidden');
    toast.classList.add('transform', 'translate-y-0');
    
    if (type === 'success') {
      toast.classList.add('bg-success');
      toast.classList.remove('bg-error');
    } else {
      toast.classList.add('bg-error');
      toast.classList.remove('bg-success');
    }
    
    setTimeout(() => {
      toast.classList.add('translate-y-full');
      setTimeout(() => {
        toast.classList.add('hidden');
        toast.classList.remove('translate-y-full', 'bg-success', 'bg-error');
      }, 300);
    }, 3000);
  }
} 