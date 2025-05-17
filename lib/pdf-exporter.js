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
    },
    useFallbackMode = false
  } = options;

  // Check if required libraries are loaded
  if (typeof jspdf === 'undefined' || (typeof html2canvas === 'undefined' && !useFallbackMode)) {
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
      await exportProject(pdf, includeChapterTitles, includeMetadata, margins, useFallbackMode);
    } else {
      // Export only current chapter
      await exportCurrentChapter(pdf, includeChapterTitles, includeMetadata, margins, useFallbackMode);
    }

    // Save the PDF
    pdf.save(filename);

    // Hide loading indicator
    hideLoading();

    // Show success message
    showToast('PDF exported successfully!', 'success');
  } catch (error) {
    console.error('Error exporting PDF:', error);
    
    // If not already in fallback mode, try again with fallback mode
    if (!useFallbackMode) {
      console.log('Retrying with fallback text-only export mode...');
      hideLoading();
      
      try {
        // Try again with fallback mode
        await exportToPdf({
          ...options,
          useFallbackMode: true
        });
        return; // If fallback succeeds, we're done
      } catch (fallbackError) {
        console.error('Fallback export also failed:', fallbackError);
      }
    }
    
    // If we get here, both normal and fallback methods failed
    hideLoading();
    showToast('Failed to export PDF: ' + error.message, 'error');
  }
}

// Load required libraries dynamically
async function loadDependencies() {
  console.log('Loading PDF export dependencies...');
  
  return new Promise((resolve, reject) => {
    // Function to create and add a script to the page
    const loadScript = (url, fallbackUrl) => {
      return new Promise((scriptResolve, scriptReject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        
        // Add load event
        script.onload = () => {
          console.log(`Loaded script: ${url}`);
          scriptResolve();
        };
        
        // Add error event with fallback
        script.onerror = () => {
          console.warn(`Failed to load script from ${url}, trying fallback...`);
          
          if (fallbackUrl) {
            // Try fallback URL
            const fallbackScript = document.createElement('script');
            fallbackScript.src = fallbackUrl;
            fallbackScript.async = true;
            
            fallbackScript.onload = () => {
              console.log(`Loaded fallback script: ${fallbackUrl}`);
              scriptResolve();
            };
            
            fallbackScript.onerror = () => {
              console.error(`Failed to load from fallback URL: ${fallbackUrl}`);
              scriptReject(new Error(`Failed to load script from ${url} and fallback ${fallbackUrl}`));
            };
            
            document.head.appendChild(fallbackScript);
          } else {
            scriptReject(new Error(`Failed to load script: ${url}`));
          }
        };
        
        // Add to the document
        document.head.appendChild(script);
      });
    };
    
    // Load all needed libraries in parallel
    Promise.all([
      // jsPDF with fallback
      typeof jspdf === 'undefined' ? 
        loadScript(
          'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
          'https://unpkg.com/jspdf@2.5.1/dist/jspdf.umd.min.js'
        ) : Promise.resolve(),
        
      // html2canvas with fallback
      typeof html2canvas === 'undefined' ? 
        loadScript(
          'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
          'https://unpkg.com/html2canvas@1.4.1/dist/html2canvas.min.js'
        ).catch(err => {
          // We can proceed without html2canvas, will use fallback text mode
          console.warn('Could not load html2canvas, will use text-only mode:', err);
          return Promise.resolve();
        }) : Promise.resolve()
    ])
    .then(() => {
      // Check if the libraries are properly loaded
      let loadedLibs = [];
      
      if (typeof jspdf !== 'undefined') {
        loadedLibs.push('jsPDF');
      } else {
        throw new Error('jsPDF library failed to load');
      }
      
      if (typeof html2canvas !== 'undefined') {
        loadedLibs.push('html2canvas');
      } else {
        console.warn('html2canvas library not loaded, will use text-only mode');
      }
      
      console.log(`Successfully loaded libraries: ${loadedLibs.join(', ')}`);
      resolve();
    })
    .catch(error => {
      console.error('Error loading dependencies:', error);
      // If at least jsPDF is loaded, we can still proceed with fallback mode
      if (typeof jspdf !== 'undefined') {
        console.warn('Proceeding with partial dependencies (text-only mode)');
        resolve();
      } else {
        reject(error);
      }
    });
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
async function exportCurrentChapter(pdf, includeChapterTitles, includeMetadata, margins, useFallbackMode) {
  // Get current chapter
  const currentChapter = window.appState?.currentChapter;
  if (!currentChapter) {
    throw new Error('No chapter is currently selected');
  }

  // Add chapter to PDF
  if (useFallbackMode) {
    addChapterToPdfFallback(pdf, currentChapter, includeChapterTitles, includeMetadata, margins, 1);
  } else {
    try {
      await addChapterToPdf(pdf, currentChapter, includeChapterTitles, includeMetadata, margins, 1);
    } catch (error) {
      console.error('Error using html2canvas, falling back to text-only mode:', error);
      // Fallback to text-only if html2canvas fails
      addChapterToPdfFallback(pdf, currentChapter, includeChapterTitles, includeMetadata, margins, 1);
    }
  }
}

// Export all chapters of the project
async function exportProject(pdf, includeChapterTitles, includeMetadata, margins, useFallbackMode) {
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
    if (useFallbackMode) {
      addChapterToPdfFallback(pdf, allChapters[i], includeChapterTitles, includeMetadata, margins, i + 1);
    } else {
      try {
        await addChapterToPdf(pdf, allChapters[i], includeChapterTitles, includeMetadata, margins, i + 1);
      } catch (error) {
        console.error(`Error with html2canvas for chapter ${i+1}, using fallback:`, error);
        addChapterToPdfFallback(pdf, allChapters[i], includeChapterTitles, includeMetadata, margins, i + 1);
      }
    }
    
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
  tempDiv.style.color = '#000000'; // Ensure text is black for better contrast
  tempDiv.style.backgroundColor = '#ffffff'; // White background for clean export
  tempDiv.innerHTML = chapter.content || '';
  
  // Apply style overrides to handle OKLCH color format issue
  overrideUnsupportedStyles(tempDiv);
  
  // Append to body
  document.body.appendChild(tempDiv);
  
  // Use html2canvas to render the content
  try {
    const canvas = await html2canvas(tempDiv, {
      scale: 2,
      logging: false,
      useCORS: true,
      backgroundColor: '#ffffff',
      ignoreElements: (element) => {
        // Ignore elements with OKLCH color values or other problematic styles
        const computedStyle = window.getComputedStyle(element);
        const color = computedStyle.color;
        const backgroundColor = computedStyle.backgroundColor;
        return color.includes('oklch') || backgroundColor.includes('oklch');
      }
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

// Function to override unsupported styles in the content
function overrideUnsupportedStyles(container) {
  // Create a style element to override OKLCH colors
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    /* Override oklch colors with standard colors */
    [style*="oklch"], [style*="OKLCH"] {
      color: #000000 !important;
      background-color: transparent !important;
    }
    
    /* Override text, background, and borders with compatible colors */
    * {
      color: #000000 !important;
      border-color: #000000 !important;
    }
    
    /* Set basic backgrounds */
    body, div, p, h1, h2, h3, h4, h5, h6, span {
      background-color: #ffffff !important;
    }
    
    /* Ensure proper contrast for links */
    a {
      color: #0000FF !important;
      text-decoration: underline !important;
    }
  `;
  
  container.appendChild(styleEl);
  
  // Process all elements within the container
  const elements = container.querySelectorAll('*');
  elements.forEach(element => {
    // Check for inline styles with OKLCH
    const style = element.getAttribute('style');
    if (style && (style.includes('oklch') || style.includes('OKLCH'))) {
      // Replace OKLCH with safe values
      let newStyle = style.replace(/oklch\([^)]+\)/gi, '#000000');
      element.setAttribute('style', newStyle);
    }
    
    // Force black text color for text elements
    if (element.tagName.match(/^(P|H[1-6]|SPAN|DIV|LI|TD|TH)$/)) {
      element.style.color = '#000000';
      element.style.backgroundColor = 'transparent';
    }
  });
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

// Fallback method: Add a chapter to the PDF as text only
function addChapterToPdfFallback(pdf, chapter, includeChapterTitle, includeMetadata, margins, chapterNumber) {
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
  
  // Create a temporary div to extract text content
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = chapter.content || '';
  
  // Extract text content, avoiding HTML tags
  const textContent = extractTextFromHtml(tempDiv);
  
  // Set font for content
  pdf.setFontSize(11);
  pdf.setFont('Helvetica', 'normal');
  
  // Split text into lines that fit the page width
  const availableWidth = pdf.internal.pageSize.width - left - right;
  const textLines = pdf.splitTextToSize(textContent, availableWidth);
  
  // Calculate lines per page (approximate)
  const lineHeight = 7; // in mm
  const linesPerPage = Math.floor((pdf.internal.pageSize.height - currentY - bottom) / lineHeight);
  
  // Add text to PDF page by page
  for (let i = 0; i < textLines.length; i += linesPerPage) {
    // Get lines for this page
    const pageLines = textLines.slice(i, i + linesPerPage);
    
    // Add lines to page
    pdf.text(pageLines, left, currentY);
    
    // If there are more lines, add a new page
    if (i + linesPerPage < textLines.length) {
      pdf.addPage();
      currentY = top;
    }
  }
}

// Helper function to extract formatted text from HTML content
function extractTextFromHtml(htmlElement) {
  // Create a document fragment to safely work with the HTML
  const fragment = document.createDocumentFragment();
  const container = document.createElement('div');
  container.innerHTML = htmlElement.innerHTML;
  fragment.appendChild(container);
  
  let result = '';
  const queue = [container];
  
  // Track heading levels and formatting
  const currentFormatting = {
    isBold: false,
    isItalic: false,
    isHeading: false,
    indent: 0
  };
  
  while (queue.length > 0) {
    const element = queue.shift();
    
    // Process element based on tag type
    switch (element.tagName?.toLowerCase()) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        result += '\n\n' + element.textContent.toUpperCase() + '\n\n';
        break;
        
      case 'p':
        if (result && !result.endsWith('\n\n')) {
          result += '\n\n';
        }
        result += element.textContent;
        if (!result.endsWith('\n')) {
          result += '\n';
        }
        break;
        
      case 'br':
        result += '\n';
        break;
        
      case 'li':
        result += '\n• ' + element.textContent;
        break;
        
      case 'strong':
      case 'b':
        result += element.textContent;
        break;
        
      case 'em':
      case 'i':
        result += element.textContent;
        break;
        
      case 'blockquote':
        result += '\n\n"' + element.textContent + '"\n\n';
        break;
        
      case undefined:
        // Text node
        if (element.textContent && element.textContent.trim()) {
          result += element.textContent;
        }
        break;
        
      default:
        // For other elements, add their text content if they don't have children
        if (element.children.length === 0 && element.textContent.trim()) {
          result += element.textContent;
        }
    }
    
    // Add children to queue
    for (let i = 0; i < element.children.length; i++) {
      queue.push(element.children[i]);
    }
  }
  
  // Clean up extra whitespace and line breaks
  return result.replace(/\n{3,}/g, '\n\n').trim();
} 