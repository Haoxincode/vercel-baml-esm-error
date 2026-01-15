/**
 * ID Mapper - Bidirectional UUID ↔ Integer mapping
 * Used to optimize BAML token usage by replacing UUIDs with integers
 */

export type IdMapper<T> = {
	toInt: Map<T, number>
	toUuid: Map<number, T>
	maxId: number
}

/**
 * Create bidirectional mapper from UUID to integer
 */
export function createIdMapper<T extends string>(ids: T[]): IdMapper<T> {
	const toInt = new Map<T, number>()
	const toUuid = new Map<number, T>()

	ids.forEach((id, index) => {
		const intId = index + 1 // Start from 1
		toInt.set(id, intId)
		toUuid.set(intId, id)
	})

	return {
		toInt,
		toUuid,
		maxId: ids.length,
	}
}

/**
 * Safely resolve integer ID to UUID
 */
export function resolveIdSafe<T>(mapper: IdMapper<T>, id: number): T | undefined {
	return mapper.toUuid.get(id)
}
