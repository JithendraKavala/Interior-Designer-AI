import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { image, theme, room, settings, userId } = body;

    console.log(`Processing ${theme} style for ${room}`);

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
    const base64Data = image.split(',')[1]; // Remove data URL prefix
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Create form data for the Python API
    const formData = new FormData();
    formData.append('file', new Blob([imageBuffer], { type: 'image/jpeg' }), 'input.jpg');
    
    // Enhanced prompt based on settings
    let prompt = `${theme} style ${room} interior design`;
    if (parsedSettings.enhanceLighting !== false) {
      prompt += ', bright lighting, well-lit, natural lighting, warm atmosphere';
    }
    if (parsedSettings.preserveColors) {
      prompt += ', maintaining original color palette, color harmony';
    }
    prompt += ', professional photography, high quality, detailed, realistic, 8k resolution';
    
    formData.append('prompt', prompt);
    
    // Add settings to form data if using enhanced API
    if (Object.keys(parsedSettings).length > 0) {
      formData.append('settings', JSON.stringify(parsedSettings));
    }

    console.log('Sending request to Python API...');

    // Determine which endpoint to use based on available settings
    const endpoint = Object.keys(parsedSettings).length < 0 
      ? `${process.env.NEXT_PUBLIC_API_URL}/generate/advanced`
      : `${process.env.NEXT_PUBLIC_API_URL}/generate/`;
    console.log(`Using endpoint: ${endpoint}`);
    
    // Send request to Python API
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Python API error:', response.status, errorText);
      throw new Error(`Python API error: ${response.status} - ${errorText}`);
    }


    // Get the JSON response from the Python API
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Generation failed');
    }
    console.log(result);
    
    // The backend now returns base64 data URLs directly
    const generatedDataURL =  result.output[0]; // First image from the output array

    // Save generated image to history if userId is provided
    if (userId) {
      try {
        await prisma.imageHistory.create({
          data: {
            userId,
            imageUrl: generatedDataURL,
          },
        });
        console.log('Image saved to history for user:', userId);
      } catch (historyError) {
        console.warn('Failed to save image to history:', historyError);
        // Don't fail the entire request if history saving fails
      }
    }

    return NextResponse.json({
      output: [image, generatedDataURL],
      message: `${theme} style applied successfully!`,
      success: true
    });

  } catch (error) {
    console.error('Transform error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Error processing transformation',
      success: false
    }, { status: 500 });
  }
}
