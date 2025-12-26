import type { BlockNoteEditor } from '@blocknote/core';

// Maximum visual weight per slide (replaces simple block count)
const MAX_WEIGHT_PER_SLIDE = 20;

// Estimate the visual "weight" of a block based on content and nesting
const estimateBlockWeight = (block: any): number => {
  if (!block._domElement) return 1;

  // Count nested blocks (for lists with many children)
  const nestedBlocks = block._domElement.querySelectorAll('.bn-block-outer');
  const nestedCount = nestedBlocks.length;

  // Get text content length
  const textContent = block._domElement.textContent || '';
  const textLength = textContent.trim().length;

  // Calculate weight components
  const baseWeight = 1;
  const textWeight = textLength / 200; // ~200 characters = 1 weight unit
  const nestingWeight = nestedCount * 0.3; // Each nested block = 0.3 weight units

  // Headings don't count toward weight - they trigger their own splits in Step 3
  if (block.type === 'heading') {
    return 0;
  }

  // Block type multipliers (only for non-heading blocks)
  let typeMultiplier = 1;
  if (block.type === 'code' || block.type === 'table') {
    typeMultiplier = 1.5; // Code and tables take more space
  }

  const totalWeight = (baseWeight + textWeight + nestingWeight) * typeMultiplier;

  return Math.max(1, totalWeight); // Minimum weight of 1
};

// Extract text content from inline content
const extractText = (content: any[]): string => {
  if (!content) return '';
  return content.map((item: any) => {
    if (typeof item === 'string') return item;
    if (item.type === 'text') return item.text || '';
    if (item.type === 'link') return extractText(item.content || []);
    return '';
  }).join('');
};

// Check if a block is empty (has no meaningful content)
const isEmptyBlock = (block: any): boolean => {
  // Check text content from DOM
  const text = block._domElement?.textContent?.trim() || '';
  return text === '';
};

// Check if a slide (array of blocks) contains only empty blocks
const isEmptySlide = (blocks: any[]): boolean => {
  if (blocks.length === 0) return true;
  return blocks.every(block => isEmptyBlock(block));
};

// Check if a block is a manual separator (---, ***, ___, or divider block)
const isManualSeparator = (block: any): boolean => {
  if (block.type === 'horizontalRule' || block.type === 'divider') {
    return true;
  }
  if (block.type === 'paragraph') {
    const text = block._domElement?.textContent?.trim() || '';
    return text === '---' || text === '***' || text === '—' || text === '___' || text === '- - -';
  }
  return false;
};

// Check if a block is a custom block type that should get its own slide
const isCustomBlock = (block: any): boolean => {
  const customBlockTypes = ['whiteboard', 'spreadsheet', 'mermaid'];
  return customBlockTypes.includes(block.type);
};

// Get heading level (0 if not a heading)
const getHeadingLevel = (block: any): number => {
  if (block.type !== 'heading') return 0;
  return block.props?.level || 1;
};

// STEP 1: Split by --- markers (ALWAYS first)
const splitByMarkers = (blocks: any[]): any[][] => {
  const sections: any[][] = [];
  let current: any[] = [];

  for (const block of blocks) {
    if (isManualSeparator(block)) {
      if (current.length > 0) {
        sections.push(current);
        current = [];
      }
    } else {
      current.push(block);
    }
  }
  if (current.length > 0) sections.push(current);
  return sections.length > 0 ? sections : [blocks];
};

// STEP 2: Split by custom blocks (each custom block gets its own slide)
const splitByCustomBlocks = (blocks: any[]): any[][] => {
  const sections: any[][] = [];
  let current: any[] = [];

  for (const block of blocks) {
    if (isCustomBlock(block)) {
      // Push any accumulated regular blocks
      if (current.length > 0) {
        sections.push(current);
        current = [];
      }
      // Custom block gets its own slide
      sections.push([block]);
    } else {
      current.push(block);
    }
  }

  if (current.length > 0) sections.push(current);
  return sections.length > 0 ? sections : [blocks];
};

// STEP 3: Split by headings (H1 and H2 only - H3 is treated as subheading)
const splitByHeadings = (blocks: any[]): any[][] => {
  const hasH1 = blocks.some(b => getHeadingLevel(b) === 1);
  const hasH2 = blocks.some(b => getHeadingLevel(b) === 2);

  if (!hasH1 && !hasH2) return [blocks]; // No H1/H2 headings, keep as one

  const sections: any[][] = [];
  let current: any[] = [];

  // Determine split level: H1 if present, otherwise H2
  const splitLevel = hasH1 ? 1 : 2;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const level = getHeadingLevel(block);

    // Split on H1 or H2 (depending on splitLevel), but NOT on H3
    if (level === splitLevel && i > 0) {
      // Only split if current section has content (not just headings)
      // This prevents slides with a single heading
      const hasContent = current.some(b => getHeadingLevel(b) === 0);

      if (hasContent && current.length > 0) {
        sections.push(current);
        current = [block];
      } else {
        // No content yet, keep accumulating (heading + subheadings)
        current.push(block);
      }
    } else {
      current.push(block);
    }
  }

  if (current.length > 0) sections.push(current);
  return sections.length > 0 ? sections : [blocks];
};

// STEP 4: Smart split for long sections using visual weight instead of block count
const splitLongSection = (blocks: any[]): any[][] => {
  // Calculate total weight of all blocks
  const totalWeight = blocks.reduce((sum, block) => sum + estimateBlockWeight(block), 0);

  // If total weight fits in one slide, no need to split
  if (totalWeight <= MAX_WEIGHT_PER_SLIDE) {
    return [blocks];
  }

  const slides: any[][] = [];
  let currentSlide: any[] = [];
  let currentWeight = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const blockWeight = estimateBlockWeight(block);

    // Would adding this block exceed the threshold?
    if (currentWeight + blockWeight > MAX_WEIGHT_PER_SLIDE) {
      // Check if this block can fit on its own slide
      if (blockWeight <= MAX_WEIGHT_PER_SLIDE) {
        // YES - Move entire block to next slide (don't cut it)
        if (currentSlide.length > 0) {
          slides.push(currentSlide);
        }
        currentSlide = [block];
        currentWeight = blockWeight;
      } else {
        // NO - Block is too large even for its own slide
        // Put it on its own slide anyway (unavoidable overflow)
        if (currentSlide.length > 0) {
          slides.push(currentSlide);
        }
        slides.push([block]);
        currentSlide = [];
        currentWeight = 0;
      }
    } else {
      // Block fits, add it to current slide
      currentSlide.push(block);
      currentWeight += blockWeight;

      // Optional: Try to break at H3 boundaries when we're getting close to limit
      const nextBlock = blocks[i + 1];
      if (nextBlock) {
        const nextWeight = estimateBlockWeight(nextBlock);
        const nextLevel = getHeadingLevel(nextBlock);

        // If next block is H3 and adding it would exceed, break here
        if (nextLevel === 3 && currentWeight + nextWeight > MAX_WEIGHT_PER_SLIDE) {
          slides.push(currentSlide);
          currentSlide = [];
          currentWeight = 0;
        }
      }
    }
  }

  // Add remaining blocks
  if (currentSlide.length > 0) {
    slides.push(currentSlide);
  }

  return slides.length > 0 ? slides : [blocks];
};

/**
 * Generate slides HTML from BlockNote editor using pure DOM traversal.
 * This preserves all custom blocks and nested structures.
 */
export const generateSlidesFromBlocks = (editor: BlockNoteEditor<any, any, any>): string[] => {
  const tiptapEditor = (editor as any)._tiptapEditor;
  if (!tiptapEditor) {
    console.error('Could not access tiptap editor');
    return ['<p>Error: Could not access editor</p>'];
  }

  // Use pure DOM - no ProseMirror mapping needed!
  const editorContainer = tiptapEditor.view.dom;
  const allBlockElements = Array.from(editorContainer.querySelectorAll('.bn-block-outer')) as HTMLElement[];

  // Filter to only top-level blocks (not nested in another block-group)
  const topLevelBlockElements = allBlockElements.filter((blockEl) => {
    let parent = blockEl.parentElement;
    let blockGroupCount = 0;

    while (parent && parent !== editorContainer) {
      if (parent.classList.contains('bn-block-group')) {
        blockGroupCount++;
      }
      parent = parent.parentElement;
    }

    return blockGroupCount === 1;
  });

  console.log('=== DOM-based Collection ===');
  console.log('Total .bn-block-outer elements:', allBlockElements.length);
  console.log('Top-level blocks:', topLevelBlockElements.length);

  // Extract block data directly from DOM
  const docContent: any[] = [];

  topLevelBlockElements.forEach((domElement) => {
    // Get block type from data attribute or element structure
    const blockContent = domElement.querySelector('[data-content-type]');
    const type = blockContent?.getAttribute('data-content-type') || 'paragraph';

    // Extract additional props based on block type
    const props: any = {};

    if (type === 'heading') {
      // Try to get heading level from data attribute
      const levelAttr = blockContent?.getAttribute('data-level');
      if (levelAttr) {
        props.level = parseInt(levelAttr, 10);
      } else {
        // Fallback: check for h1, h2, h3 elements inside
        const h1 = domElement.querySelector('h1');
        const h2 = domElement.querySelector('h2');
        const h3 = domElement.querySelector('h3');
        if (h1) props.level = 1;
        else if (h2) props.level = 2;
        else if (h3) props.level = 3;
        else props.level = 1; // Default to H1
      }
    }

    const blockData: any = {
      type: type,
      props: props,
      _domElement: domElement, // Store DOM reference directly
    };

    docContent.push(blockData);
  });

  // Filter out slideshow blocks
  let allBlocks = docContent.filter((b: any) => b.type !== 'slideshow');

  console.log('=== Slide Generation Debug ===');
  console.log('Total blocks collected:', docContent.length);
  console.log('After filtering slideshows:', allBlocks.length);
  console.log('Block types:', allBlocks.map(b => b.type).join(', '));

  // Skip leading empty blocks to prevent blank first slide
  let firstNonEmptyIndex = 0;
  while (firstNonEmptyIndex < allBlocks.length && isEmptyBlock(allBlocks[firstNonEmptyIndex])) {
    firstNonEmptyIndex++;
  }
  allBlocks = allBlocks.slice(firstNonEmptyIndex);

  if (allBlocks.length === 0) {
    return ['<p>Empty Canvas</p>'];
  }

  // Apply splitting logic
  const markerSections = splitByMarkers(allBlocks);
  const finalSlides: any[][] = [];

  for (const section of markerSections) {
    if (section.length === 0 || isEmptySlide(section)) continue;

    // Split by custom blocks (each custom block gets its own slide)
    const customBlockSections = splitByCustomBlocks(section);

    for (const customSection of customBlockSections) {
      if (isEmptySlide(customSection)) continue;

      // Split by headings (primary strategy for regular content)
      const headingSections = splitByHeadings(customSection);

      // For each heading section, split by weight if needed
      for (const headingSection of headingSections) {
        if (isEmptySlide(headingSection)) continue;

        // splitLongSection now handles weight-based splitting internally
        const blockSections = splitLongSection(headingSection);
        finalSlides.push(...blockSections.filter(slide => !isEmptySlide(slide)));
      }
    }
  }

  if (finalSlides.length === 0) {
    return ['<p>Empty Canvas</p>'];
  }

  console.log('Final slides count:', finalSlides.length);
  console.log('Blocks per slide:', finalSlides.map(s => s.length).join(', '));
  console.log('=== End Debug ===');

  // Build slides by cloning DOM elements directly
  const htmlSlides = finalSlides.map((slideBlocks) => {
    const slideDiv = document.createElement('div');
    slideDiv.className = 'bn-slide-content';

    for (const block of slideBlocks) {
      const domElement = block._domElement;

      if (domElement) {
        // Clone the actual DOM element (preserves nested lists, mermaid, etc.)
        const clone = domElement.cloneNode(true) as HTMLElement;

        // Clean up editor-specific attributes and elements
        clone.removeAttribute('contenteditable');
        clone.querySelectorAll('[contenteditable]').forEach(el => el.removeAttribute('contenteditable'));
        clone.querySelectorAll('.bn-block-handle, .bn-add-block-button, .bn-drag-handle').forEach(el => el.remove());

        slideDiv.appendChild(clone);
      }
    }

    return slideDiv.innerHTML || '<p>Empty slide</p>';
  });

  return htmlSlides;
};
