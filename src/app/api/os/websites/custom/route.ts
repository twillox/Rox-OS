import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
  try {
    const { businessName, industry, websiteType, features, budget, deadline } = await req.json();

    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'default_business';

    const projectId = `proj_${uuidv4()}`;

    // Create the custom project in the DB
    await prisma.customProject.create({
      data: {
        id: projectId,
        businessId,
        businessName,
        industry,
        websiteType,
        features,
        budget,
        deadline,
        status: 'review', // 'review', 'design', 'development', 'testing', 'launch'
        timeline: [
          { label: 'Requirements Received', status: 'completed', date: new Date().toISOString() },
          { label: 'Project Kickoff', status: 'current', date: 'In Progress' },
          { label: 'Design Mockups', status: 'pending', date: 'Upcoming' },
          { label: 'Development', status: 'pending', date: 'Upcoming' },
          { label: 'Testing & QA', status: 'pending', date: 'Upcoming' },
          { label: 'Launch', status: 'pending', date: 'Upcoming' }
        ],
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

    return NextResponse.json({ success: true, projectId });
  } catch (error: any) {
    console.error('Create Custom Project Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('projectId');
    const cookieStore = await cookies();
    const businessId = cookieStore.get('businessId')?.value || 'default_business';
    
    if (projectId) {
      const project = await prisma.customProject.findFirst({
        where: { id: projectId }
      });

      if (!project) return NextResponse.json({ error: 'Not found' }, { status: 404 });
      return NextResponse.json(project);
    }

    const projects = await prisma.customProject.findMany({
      where: { businessId }
    });

    return NextResponse.json(projects);
  } catch (error: any) {
    console.error('Get Custom Project Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
