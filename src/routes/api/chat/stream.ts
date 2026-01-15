/**
 * AI Assistant - Streaming API
 *
 * Uses BAML + createUIMessageStream for streaming responses
 * Receives AI SDK 5.x standard UIMessage format
 */

import { createFileRoute } from "@tanstack/react-router"
import { b } from "@baml"
import type { ChatMessage } from "@baml/types"
import {
	type ModelMessage,
	type TextPart,
	type UIMessage,
	convertToModelMessages,
} from "ai"
import { createBAMLStreamResponse } from "~/lib/baml-stream"
import { createIdMapper } from "~/lib/id-mapper"

// Default document content (demo)
const DEFAULT_COURSE_CONTENT = `
# Project-Based Learning Guide

## Chapter 1: PBL Fundamentals
1. **What is Project-Based Learning (PBL)**: Driven by real problems, students complete projects through inquiry and collaboration.
2. **STEAM Integration**: Organically combines Science, Technology, Engineering, Arts, and Mathematics.
3. **Student-Led**: Teachers are facilitators, students are the main learners.

## Chapter 2: Course Design Principles
1. **Real Context**: Projects should relate to students' lives and solve real problems.
2. **Cross-Disciplinary Integration**: Combine multi-disciplinary knowledge to develop comprehensive skills.
3. **Process Evaluation**: Focus on the learning process, not just the results.

## Chapter 3: Assessment Criteria
1. **Innovative Thinking**: Ability to propose novel solutions.
2. **Team Collaboration**: Effective communication and division of labor in groups.
3. **Problem Solving**: Ability to analyze problems and find solutions.
4. **Presentation**: Ability to clearly present and explain their work.

## Chapter 4: Common Questions
1. **Grouping Strategy**: Recommend 4-5 people per group, mixed ability grouping.
2. **Time Arrangement**: Each project is recommended to be completed in 2-4 weeks.
3. **Resource Preparation**: Prepare material lists and safety guidelines in advance.
`

// AI SDK 5.x UIMessage format
type CourseDataParts = {
	response: {
		answer?: string | null
		reasoning?: string | null
		sources?: Array<{
			id: string
			documentId: string
			documentName: string
			section: string | null
		}> | null
		confidence?: "high" | "medium" | "low" | null
	}
	metadata: {
		isComplete: boolean
		[key: string]: unknown
	}
}

type CourseUIMessage = UIMessage<never, CourseDataParts>

// AI SDK 5.x transport request format
interface TransportRequest {
	messages: CourseUIMessage[]
	chatId?: string
	// Custom body data
	sessionId?: string
}

/**
 * Convert model messages to BAML ChatMessage[]
 */
function toBAMLMessages(modelMsgs: ModelMessage[]): ChatMessage[] {
	const getTextContent = (message: ModelMessage): string => {
		if (typeof message.content === "string") {
			return message.content
		}

		return message.content
			.filter((part): part is TextPart => part.type === "text")
			.map((part) => part.text)
			.join("")
	}

	return modelMsgs
		.filter((m) => m.role === "user" || m.role === "assistant")
		.map((m) => ({
			role: m.role as "user" | "assistant",
			content: getTextContent(m),
		}))
		.filter((m) => m.content.trim().length > 0)
}

export const Route = createFileRoute("/api/chat/stream")({
	server: {
		handlers: {
			POST: async ({ request }) => {
				try {
					const { messages, sessionId }: TransportRequest = await request.json()

					console.log("Received messages:", messages?.length ?? 0)

					// Validate messages
					if (!messages || messages.length === 0) {
						return new Response(
							JSON.stringify({ error: "Messages cannot be empty" }),
							{ status: 400, headers: { "Content-Type": "application/json" } }
						)
					}

					// Get course documents (using default doc here, should fetch from DB in production)
					interface DocInfo {
						id: string
						name: string
						content: string
					}
					const docs: DocInfo[] = [
						{
							id: "default-course-001",
							name: "Project-Based Learning Guide",
							content: DEFAULT_COURSE_CONTENT,
						},
					]

					// Create documentId → intId mapping (UUID→Int optimization)
					const docIdMapper = createIdMapper(docs.map((d) => d.id))
					console.log(`[ID Mapping] Created document mapping, range: 1-${docIdMapper.maxId}`)

					// Convert to BAML CourseDoc format (using integer IDs)
					const courseDocs = docs.map((doc) => ({
						id: docIdMapper.toInt.get(doc.id)!,
						name: doc.name,
						content: doc.content,
					}))

					// Use convertToModelMessages to process UI messages (includes data part rehydration)
					let modelMessages: ModelMessage[]
					try {
						modelMessages = convertToModelMessages<CourseUIMessage>(messages, {
							convertDataPart: (part) => {
								// Convert data-response answer/reasoning to text for BAML history visibility
								if (part.type === "data-response") {
									const answer = typeof part.data.answer === "string" ? part.data.answer.trim() : ""
									const reasoning =
										typeof part.data.reasoning === "string" ? part.data.reasoning.trim() : ""

									if (!answer && !reasoning) return undefined

									const reasoningBlock = reasoning ? `\n\n[Reasoning]\n${reasoning}` : ""
									return { type: "text", text: `${answer}${reasoningBlock}` }
								}

								return undefined
							},
						})
					} catch (error) {
						console.error("convertToModelMessages error:", error)
						return new Response(
							JSON.stringify({ error: "Invalid message format" }),
							{ status: 400, headers: { "Content-Type": "application/json" } }
						)
					}

					// Convert to BAML format
					const bamlMessages = toBAMLMessages(modelMessages)

					if (bamlMessages.length === 0) {
						return new Response(
							JSON.stringify({ error: "Message content is empty" }),
							{ status: 400, headers: { "Content-Type": "application/json" } }
						)
					}

					// Get last user message
					const lastUserMessage = bamlMessages.filter((m) => m.role === "user").pop()
					const lastUserContent = lastUserMessage?.content

					console.log("BAML messages:", bamlMessages.length, "Last user:", lastUserContent?.slice(0, 30))

					// Create BAML stream - using TeacherChat function
					const bamlStream = b.stream.TeacherChat(bamlMessages, courseDocs)

					// Return streaming response
					return createBAMLStreamResponse(bamlStream, {
						docIdMapper, // Pass integer ID→UUID mapping
						onStart: () => {
							console.log("TeacherChat stream started")
						},
						onComplete: async (final) => {
							// Can save to database here
							console.log("TeacherChat stream completed")
							return {
								confidence: final.confidence,
								sourcesCount: final.sources?.length ?? 0,
							}
						},
					})
				} catch (error) {
					console.error("Chat Stream Error:", error)
					return new Response(
						JSON.stringify({ error: "Failed to send message. Please try again." }),
						{ status: 500, headers: { "Content-Type": "application/json" } }
					)
				}
			},
		},
	},
})
