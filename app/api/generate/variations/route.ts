import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image, theme, room, settings, num_variations = 3, userId } = body;

    console.log(`Generating ${num_variations} variations for ${theme} style ${room}`);

    // Parse settings if provided
    let parsedSettings: any = {};
    if (settings) {
      try {
        parsedSettings = typeof settings === 'string' ? JSON.parse(settings) : settings;
      } catch (e) {
        console.warn('Failed to parse settings:', e);
      }
    }

    // Convert base64 image to blob for form data
    const base64Data = image.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Create form data for the Python API
    const formData = new FormData();
    formData.append('file', new Blob([imageBuffer], { type: 'image/jpeg' }), 'input.jpg');
    
    // Enhanced prompt
    let prompt = `${theme} style ${room} interior design`;
    if (parsedSettings.enhanceLighting !== false) {
      prompt += ', bright lighting, well-lit, natural lighting, warm atmosphere';
    }
    if (parsedSettings.preserveColors) {
      prompt += ', maintaining original color palette, color harmony';
    }
    prompt += ', professional photography, high quality, detailed, realistic, 8k resolution';
    
    formData.append('prompt', prompt);
    formData.append('settings', JSON.stringify(parsedSettings));
    formData.append('num_variations', num_variations.toString());

    console.log('Sending variations request to Python API...');

    // Send request to Python API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/generate/variations`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Python API error:', response.status, errorText);
      throw new Error(`Python API error: ${response.status} - ${errorText}`);
    }

    // Get the JSON response from Python API
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to generate variations');
    }

    // The backend now returns base64 data URLs directly
    const variations = result.variations; // Already base64 data URLs

    // Save generated variations to history if userId is provided
    if (userId) {
      try {
        const imageHistoryPromises = variations.map((variation: string) =>
          prisma.imageHistory.create({
            data: {
              userId,
              imageUrl: variation,
            },
          })
        );
        await Promise.all(imageHistoryPromises);
        console.log('Variations saved to history for user:', userId);
      } catch (historyError) {
        console.warn('Failed to save variations to history:', historyError);
        // Don't fail the entire request if history saving fails
      }
    }

    return NextResponse.json({
      success: true,
      variations,
      num_generated: variations.length,
      message: `Generated ${variations.length} variations successfully!`,
      settings_used: result.settings_used
    });

  } catch (error) {
    console.error('Variations generation error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error generating variations',
      success: false
    }, { status: 500 });
  }
}
