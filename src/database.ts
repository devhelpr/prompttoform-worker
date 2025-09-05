export interface FormData {
	id?: number;
	data: Record<string, any>;
	created_at?: string;
	updated_at?: string;
}

export async function initializeDatabase(db: D1Database): Promise<void> {
	// Create the forms table if it doesn't exist
	await db.exec(`
		CREATE TABLE IF NOT EXISTS forms (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			data TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`);
}

export async function storeFormData(db: D1Database, formData: Record<string, any>): Promise<FormData> {
	const dataJson = JSON.stringify(formData);

	const result = await db
		.prepare(
			`
		INSERT INTO forms (data, created_at, updated_at)
		VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
	`
		)
		.bind(dataJson)
		.run();

	const id = result.meta.last_row_id;

	return {
		id: Number(id),
		data: formData,
		created_at: new Date().toISOString(),
		updated_at: new Date().toISOString(),
	};
}

export async function getFormData(db: D1Database, id: number): Promise<FormData | null> {
	const result = await db
		.prepare(
			`
		SELECT id, data, created_at, updated_at
		FROM forms
		WHERE id = ?
	`
		)
		.bind(id)
		.first<{
			id: number;
			data: string;
			created_at: string;
			updated_at: string;
		}>();

	if (!result) {
		return null;
	}

	return {
		id: result.id,
		data: JSON.parse(result.data),
		created_at: result.created_at,
		updated_at: result.updated_at,
	};
}

export async function getAllFormData(db: D1Database, limit: number = 100, offset: number = 0): Promise<FormData[]> {
	const results = await db
		.prepare(
			`
		SELECT id, data, created_at, updated_at
		FROM forms
		ORDER BY created_at DESC
		LIMIT ? OFFSET ?
	`
		)
		.bind(limit, offset)
		.all<{
			id: number;
			data: string;
			created_at: string;
			updated_at: string;
		}>();

	return results.results.map((row) => ({
		id: row.id,
		data: JSON.parse(row.data),
		created_at: row.created_at,
		updated_at: row.updated_at,
	}));
}

export async function updateFormData(db: D1Database, id: number, formData: Record<string, any>): Promise<FormData | null> {
	const dataJson = JSON.stringify(formData);

	const result = await db
		.prepare(
			`
		UPDATE forms
		SET data = ?, updated_at = CURRENT_TIMESTAMP
		WHERE id = ?
	`
		)
		.bind(dataJson, id)
		.run();

	if (result.meta.changes === 0) {
		return null;
	}

	return {
		id,
		data: formData,
		updated_at: new Date().toISOString(),
	};
}

export async function deleteFormData(db: D1Database, id: number): Promise<boolean> {
	const result = await db
		.prepare(
			`
		DELETE FROM forms
		WHERE id = ?
	`
		)
		.bind(id)
		.run();

	return result.meta.changes > 0;
}
