/**
 * BAML Streaming Adapter - Data Reconciliation Version
 *
 * Uses AI SDK's Data Part ID reconciliation mechanism to send complete Partial Objects
 * No manual delta calculation needed; Streamdown handles typewriter effect automatically
 */

import {
	createUIMessageStream,
	createUIMessageStreamResponse,
} from "ai"
import type { BamlStream } from "@boundaryml/baml"
import { type IdMapper } from "~/lib/id-mapper"

/**
 * Streamable response base interface
 * Field names match BAML schema (using snake_case)
 */
interface StreamableFields {
	reasoning?: string | null
	answer?: string | null
	sources?: Array<{
		document_id?: number | null
		document_name?: string | null
		section?: string | null
	}> | null
	confidence?: "high" | "medium" | "low" | null
}

/**
 * BAML streaming response options
 */
type BAMLStreamOptions<TFinal> = {
	/** Callback when stream starts */
	onStart?: () => void
	/** Callback when stream completes, returns additional metadata */
	onComplete?: (final: TFinal) => Record<string, unknown> | Promise<Record<string, unknown>>
	/** Throttle interval (ms), default 50ms */
	throttleMs?: number
	/** Document ID mapper (intId → UUID) */
	docIdMapper?: IdMapper<string>
}

/**
 * Create BAML streaming response - Data Reconciliation Version
 *
 * Core approach:
 * - Use fixed ID data parts, send complete partial objects each time
 * - AI SDK auto-replaces based on type + id (not append)
 * - Streamdown component auto-calculates text diff for typewriter effect
 *
 * UUID→Int mapping optimization:
 * - AI returns integer document_id (1, 2, 3...)
 * - Convert back to real UUID via docIdMapper
 * - Saves 90% tokens, improves accuracy
 */
export function createBAMLStreamResponse<
	TPartial extends StreamableFields,
	TFinal extends StreamableFields,
>(
	bamlStream: BamlStream<TPartial, TFinal>,
	options?: BAMLStreamOptions<TFinal>
) {
	const throttleMs = options?.throttleMs ?? 50
	const messageId = `msg-${Date.now()}`
	const docIdMapper = options?.docIdMapper

	/**
	 * Transform sources: map integer IDs back to real UUIDs
	 */
	const transformSources = (
		sources: StreamableFields["sources"]
	): Array<{
		id: string
		documentId: string
		documentName: string
		section: string | null
	}> => {
		if (!sources) return []

		return sources
			.filter((s) => s.document_id != null && s.document_name)
			.map((s) => {
				// Get real UUID via integer ID
				const documentId = docIdMapper
					? (docIdMapper.toUuid.get(s.document_id!) ?? "")
					: ""

				return {
					id: `source-${s.document_id}`,
					documentId,
					documentName: s.document_name!,
					section: s.section ?? null,
				}
			})
	}

	const stream = createUIMessageStream({
		execute: async ({ writer }) => {
			options?.onStart?.()

			let lastSentTime = 0

			try {
				// Message start
				writer.write({ type: "start", messageId })

				// Process streaming output
				for await (const partial of bamlStream) {
					const now = Date.now()
					const shouldThrottle = now - lastSentTime < throttleMs

					if (!shouldThrottle) {
						const validSources = transformSources(partial.sources)

						// Send complete partial object with fixed ID
						// AI SDK auto-replaces based on type + id (not append)
						writer.write({
							type: "data-response",
							id: "response-main", // Fixed ID for reconciliation
							data: {
								reasoning: partial.reasoning ?? "",
								answer: partial.answer ?? "",
								sources: validSources,
								confidence: partial.confidence ?? null,
							},
						})

						lastSentTime = now
					}
				}

				// Get final result
				const final = await bamlStream.getFinalResponse()

				// Send final complete data
				const finalSources = transformSources(final.sources)

				writer.write({
					type: "data-response",
					id: "response-main",
					data: {
						reasoning: final.reasoning ?? "",
						answer: final.answer ?? "",
						sources: finalSources,
						confidence: final.confidence ?? null,
					},
				})

				// Custom metadata
				const metadata = await options?.onComplete?.(final) ?? {}
				writer.write({
					type: "data-metadata",
					id: "metadata-main",
					data: { isComplete: true, ...metadata },
				})

				// Message end
				writer.write({ type: "finish" })
			} catch (error) {
				console.error("BAML Stream Error:", error)
				writer.write({
					type: "error",
					errorText: error instanceof Error ? error.message : "Unknown error occurred",
				})
			}
		},
	})

	return createUIMessageStreamResponse({ stream })
}
