import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import { createDefaultSectionContent, SectionType } from '@/app/dashboard/website-studio/types';

export async function POST(req: Request) {
  try {
    const { websiteId, message, currentSections, currentTheme } = await req.json();

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'default_business';

    const website = await prisma.website.findFirst({
      where: { id: websiteId }
    });

    let newSections = JSON.parse(JSON.stringify(currentSections || []));
    let newTheme = JSON.parse(JSON.stringify(currentTheme || website?.theme || {
      colors: { primary: '#4f46e5', secondary: '#111827' },
      typography: { heading: 'Inter', body: 'System UI' }
    }));
    let aiResponse = "I have updated your website as requested!";

    // Attempt Groq LLM if configured
    let usedLlm = false;
    if (process.env.GROQ_API_KEY) {
      try {
        const { GroqProvider } = await import('@/core/providers/GroqProvider');
        const llm = new GroqProvider();
        const prompt = `You are an AI Website Builder assistant for a Shopify-style builder.
The user requested: "${message}"

Current Theme: ${JSON.stringify(newTheme)}
Current Sections (summary): ${JSON.stringify(newSections.map((s: any) => ({ id: s.id, name: s.name, type: s.type, heading: s.content?.heading })))}

Analyze what the user wants to change (colors, heading text, subheadings, buttons, adding/removing sections, or theme).
Respond in JSON format with:
{
  "aiResponse": "Conversational friendly message explaining what was changed",
  "themeUpdates": { "colors": { "primary": "...", "secondary": "..." } }, // optional
  "sectionUpdates": [
    {
      "id": "section-id-if-modifying",
      "type": "type-if-creating-or-matching",
      "heading": "new heading",
      "subheading": "new subheading",
      "buttonText": "new button text",
      "backgroundColor": "hex-or-css",
      "textColor": "hex-or-css",
      "buttonColor": "hex-or-css"
    }
  ],
  "addSectionType": "faq" // optional if user asked to add a section: hero, product-grid, testimonials, faq, newsletter, contact, etc.
}`;
        const llmResult: any = await llm.generateJSON(prompt);
        if (llmResult) {
          aiResponse = llmResult.aiResponse || aiResponse;
          if (llmResult.themeUpdates?.colors) {
            newTheme.colors = { ...newTheme.colors, ...llmResult.themeUpdates.colors };
          }
          if (Array.isArray(llmResult.sectionUpdates)) {
            for (const upd of llmResult.sectionUpdates) {
              const target = newSections.find((s: any) => s.id === upd.id || s.type === upd.type);
              if (target) {
                target.content = target.content || {};
                if (upd.heading) target.content.heading = upd.heading;
                if (upd.subheading) target.content.subheading = upd.subheading;
                if (upd.buttonText) target.content.buttonText = upd.buttonText;
                if (upd.backgroundColor) target.content.backgroundColor = upd.backgroundColor;
                if (upd.textColor) target.content.textColor = upd.textColor;
                if (upd.buttonColor) target.content.buttonColor = upd.buttonColor;
              }
            }
          }
          if (llmResult.addSectionType) {
            const secType = llmResult.addSectionType.toLowerCase() as SectionType;
            newSections.push({
              id: `sec_${uuidv4()}`,
              name: secType.charAt(0).toUpperCase() + secType.slice(1).replace('-', ' '),
              type: secType,
              orderIndex: newSections.length,
              content: createDefaultSectionContent(secType)
            });
          }
          usedLlm = true;
        }
      } catch (err: any) {
        console.warn('Groq LLM in website editor fallback to deterministic processor:', err?.message);
      }
    }

    // Deterministic fallback & enhancements
    if (!usedLlm) {
      const lower = message.toLowerCase();

      // 1. Heading extraction (quoted or 'heading to ...')
      const quoteMatch = message.match(/['"]([^'"]+)['"]/);
      let extractedHeading = quoteMatch ? quoteMatch[1] : null;
      if (!extractedHeading) {
        const toMatch = message.match(/(?:heading|headline|title)(?:\s+to\s+|\s*[:=]\s*)([^,\.]+)/i);
        if (toMatch) {
          extractedHeading = toMatch[1].trim();
        }
      }

      // Hero section targeting
      const heroSection = newSections.find((s: any) => s.type === 'hero');

      if (extractedHeading && (lower.includes('heading') || lower.includes('headline') || lower.includes('title'))) {
        if (heroSection) {
          heroSection.content.heading = extractedHeading;
          aiResponse = `I've updated the Hero heading to "${extractedHeading}".`;
        } else if (newSections.length > 0) {
          newSections[0].content.heading = extractedHeading;
          aiResponse = `I've updated the heading to "${extractedHeading}".`;
        }
      }

      // Button text extraction
      let extractedButton = quoteMatch ? quoteMatch[1] : null;
      if (!extractedButton) {
        const btnMatch = message.match(/(?:button|cta)(?:\s+to\s+|\s*[:=]\s*)([^,\.]+)/i);
        if (btnMatch) {
          extractedButton = btnMatch[1].trim();
        }
      }

      if (extractedButton && (lower.includes('button text') || lower.includes('button label') || lower.includes('cta to'))) {
        const target = heroSection || newSections.find((s: any) => s.content?.buttonText);
        if (target) {
          target.content.buttonText = extractedButton;
          aiResponse = `I've changed the button text to "${extractedButton}".`;
        }
      }

      // 2. Color styling
      let identifiedColor: string | null = null;
      let colorName = '';
      if (lower.includes('dark blue') || lower.includes('navy')) {
        identifiedColor = '#1e3a8a';
        colorName = 'dark blue';
      } else if (lower.includes('blue')) {
        identifiedColor = '#3b82f6';
        colorName = 'blue';
      } else if (lower.includes('emerald') || lower.includes('green')) {
        identifiedColor = '#10b981';
        colorName = 'emerald green';
      } else if (lower.includes('purple') || lower.includes('violet')) {
        identifiedColor = '#8b5cf6';
        colorName = 'purple';
      } else if (lower.includes('red') || lower.includes('crimson')) {
        identifiedColor = '#ef4444';
        colorName = 'red';
      } else if (lower.includes('amber') || lower.includes('gold') || lower.includes('yellow')) {
        identifiedColor = '#f59e0b';
        colorName = 'gold';
      } else if (lower.includes('black')) {
        identifiedColor = '#000000';
        colorName = 'black';
      } else if (lower.includes('dark')) {
        identifiedColor = '#0f172a';
        colorName = 'dark slate';
      } else if (lower.includes('white') || lower.includes('light')) {
        identifiedColor = '#ffffff';
        colorName = 'clean white';
      }

      // Handle dark/light theme mass switch
      if (lower.includes('dark theme') || lower.includes('dark mode')) {
        newTheme.colors.secondary = '#0f172a';
        newSections.forEach((s: any) => {
          if (s.type !== 'header' && s.type !== 'announcement-bar') {
            s.content.backgroundColor = '#0f172a';
            s.content.textColor = '#ffffff';
          }
        });
        aiResponse = "I've switched the website to a sleek dark theme aesthetic.";
      } else if (lower.includes('light theme') || lower.includes('light mode')) {
        newTheme.colors.secondary = '#ffffff';
        newSections.forEach((s: any) => {
          s.content.backgroundColor = '#ffffff';
          s.content.textColor = '#111827';
        });
        aiResponse = "I've switched the website to a clean light theme aesthetic.";
      } else if (identifiedColor) {
        if (lower.includes('button')) {
          newSections.forEach((s: any) => {
            if (s.content) {
              s.content.buttonColor = identifiedColor;
              s.content.buttonTextColor = identifiedColor === '#ffffff' ? '#111827' : '#ffffff';
            }
          });
          aiResponse = `I've updated all buttons to ${colorName}!`;
        } else if (lower.includes('hero') && heroSection) {
          heroSection.content.backgroundColor = identifiedColor;
          heroSection.content.textColor = (identifiedColor === '#ffffff' || identifiedColor === '#f8fafc') ? '#111827' : '#ffffff';
          aiResponse = `I've styled the hero section with a ${colorName} background!`;
        } else if (lower.includes('theme') || lower.includes('accent')) {
          newTheme.colors.primary = identifiedColor;
          aiResponse = `I've updated the primary brand accent to ${colorName}!`;
        } else {
          newTheme.colors.secondary = identifiedColor;
          aiResponse = `I've adjusted the color palette to ${colorName}.`;
        }
      }

      // 3. Add Sections
      if (lower.includes('add') || lower.includes('insert') || lower.includes('create')) {
        let addedType: SectionType | null = null;
        let addedName = '';

        if (lower.includes('faq') || lower.includes('question')) {
          addedType = 'faq';
          addedName = 'FAQ Accordion';
        } else if (lower.includes('testimonial') || lower.includes('review')) {
          addedType = 'testimonials';
          addedName = 'Testimonials';
        } else if (lower.includes('product') || lower.includes('shop') || lower.includes('catalog')) {
          addedType = 'product-grid';
          addedName = 'Product Grid';
        } else if (lower.includes('newsletter') || lower.includes('subscribe') || lower.includes('email')) {
          addedType = 'newsletter';
          addedName = 'Newsletter Signup';
        } else if (lower.includes('contact')) {
          addedType = 'contact';
          addedName = 'Contact Section';
        } else if (lower.includes('hero')) {
          addedType = 'hero';
          addedName = 'Hero Banner';
        } else if (lower.includes('announcement')) {
          addedType = 'announcement-bar';
          addedName = 'Announcement Bar';
        }

        if (addedType) {
          newSections.push({
            id: `sec_${uuidv4()}`,
            name: addedName,
            type: addedType,
            orderIndex: newSections.length,
            content: createDefaultSectionContent(addedType)
          });
          aiResponse = `I've added a new ${addedName} section to your website layout!`;
        }
      }

      // 4. Remove / Delete Section
      if (lower.includes('remove') || lower.includes('delete')) {
        if (newSections.length > 1) {
          const removed = newSections.pop();
          aiResponse = `I've removed the ${removed?.name || 'last'} section.`;
        }
      }
    }

    return NextResponse.json({
      success: true,
      aiResponse,
      updatedTheme: newTheme,
      updatedSections: newSections
    });
  } catch (error: any) {
    console.error('Editor AI Chat Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
