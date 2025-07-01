import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { DocumentationService } from "@/lib/database"

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      )
    }

    // Use githubId as fallback if user.id is not set (same as generate-documentation)
    const userId = session.user?.id || session.user?.githubId
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - No user ID available" }, 
        { status: 401 }
      )
    }

    const documentations = await DocumentationService.getUserDocumentations(userId)

    return NextResponse.json({
      success: true,
      documentations
    })

  } catch (error) {
    console.error("Error fetching documentations:", error)
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.accessToken) {
      return NextResponse.json(
        { error: "Unauthorized" }, 
        { status: 401 }
      )
    }

    // Use githubId as fallback if user.id is not set (same as generate-documentation)
    const userId = session.user?.id || session.user?.githubId
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized - No user ID available" }, 
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: "Documentation ID is required" },
        { status: 400 }
      )
    }

    const deleted = await DocumentationService.deleteDocumentation(id, userId)

    if (!deleted) {
      return NextResponse.json(
        { error: "Documentation not found or could not be deleted" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Documentation deleted successfully"
    })

  } catch (error) {
    console.error("Error deleting documentation:", error)
    
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
