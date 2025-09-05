import { describe, it, expect, beforeEach, vi } from 'vitest';
import { storeFormData, getFormData, getAllFormData, updateFormData, deleteFormData, initializeDatabase } from '../src/database';

describe('Database Operations', () => {
	let mockDb: any;

	beforeEach(() => {
		// Mock D1Database
		mockDb = {
			exec: vi.fn().mockResolvedValue(undefined),
			prepare: vi.fn().mockReturnThis(),
			bind: vi.fn().mockReturnThis(),
			run: vi.fn(),
			first: vi.fn(),
			all: vi.fn(),
		};
	});

	describe('initializeDatabase', () => {
		it('should create the forms table if it does not exist', async () => {
			await initializeDatabase(mockDb);

			expect(mockDb.exec).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS forms'));
		});
	});

	describe('storeFormData', () => {
		it('should store form data and return the stored data with id', async () => {
			const testData = { name: 'John Doe', email: 'john@example.com' };
			const mockResult = { meta: { last_row_id: 1 } };

			mockDb.run.mockResolvedValue(mockResult);

			const result = await storeFormData(mockDb, testData);

			expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO forms'));
			expect(mockDb.bind).toHaveBeenCalledWith(JSON.stringify(testData));
			expect(mockDb.run).toHaveBeenCalled();
			expect(result).toEqual({
				id: 1,
				data: testData,
				created_at: expect.any(String),
				updated_at: expect.any(String),
			});
		});
	});

	describe('getFormData', () => {
		it('should return form data when found', async () => {
			const testData = { name: 'John Doe', email: 'john@example.com' };
			const mockResult = {
				id: 1,
				data: JSON.stringify(testData),
				created_at: '2023-01-01T00:00:00Z',
				updated_at: '2023-01-01T00:00:00Z',
			};

			mockDb.first.mockResolvedValue(mockResult);

			const result = await getFormData(mockDb, 1);

			expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
			expect(mockDb.bind).toHaveBeenCalledWith(1);
			expect(mockDb.first).toHaveBeenCalled();
			expect(result).toEqual({
				id: 1,
				data: testData,
				created_at: '2023-01-01T00:00:00Z',
				updated_at: '2023-01-01T00:00:00Z',
			});
		});

		it('should return null when data not found', async () => {
			mockDb.first.mockResolvedValue(null);

			const result = await getFormData(mockDb, 999);

			expect(result).toBeNull();
		});
	});

	describe('getAllFormData', () => {
		it('should return all form data with pagination', async () => {
			const testData1 = { name: 'John Doe', email: 'john@example.com' };
			const testData2 = { name: 'Jane Smith', email: 'jane@example.com' };
			const mockResults = {
				results: [
					{
						id: 2,
						data: JSON.stringify(testData2),
						created_at: '2023-01-02T00:00:00Z',
						updated_at: '2023-01-02T00:00:00Z',
					},
					{
						id: 1,
						data: JSON.stringify(testData1),
						created_at: '2023-01-01T00:00:00Z',
						updated_at: '2023-01-01T00:00:00Z',
					},
				],
			};

			mockDb.all.mockResolvedValue(mockResults);

			const result = await getAllFormData(mockDb, 10, 0);

			expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
			expect(mockDb.bind).toHaveBeenCalledWith(10, 0);
			expect(mockDb.all).toHaveBeenCalled();
			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				id: 2,
				data: testData2,
				created_at: '2023-01-02T00:00:00Z',
				updated_at: '2023-01-02T00:00:00Z',
			});
		});
	});

	describe('updateFormData', () => {
		it('should update form data and return updated data', async () => {
			const updatedData = { name: 'John Updated', email: 'john.updated@example.com' };
			const mockResult = { meta: { changes: 1 } };

			mockDb.run.mockResolvedValue(mockResult);

			const result = await updateFormData(mockDb, 1, updatedData);

			expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE forms'));
			expect(mockDb.bind).toHaveBeenCalledWith(JSON.stringify(updatedData), 1);
			expect(mockDb.run).toHaveBeenCalled();
			expect(result).toEqual({
				id: 1,
				data: updatedData,
				updated_at: expect.any(String),
			});
		});

		it('should return null when data not found', async () => {
			const mockResult = { meta: { changes: 0 } };

			mockDb.run.mockResolvedValue(mockResult);

			const result = await updateFormData(mockDb, 999, { name: 'Test' });

			expect(result).toBeNull();
		});
	});

	describe('deleteFormData', () => {
		it('should delete form data and return true', async () => {
			const mockResult = { meta: { changes: 1 } };

			mockDb.run.mockResolvedValue(mockResult);

			const result = await deleteFormData(mockDb, 1);

			expect(mockDb.prepare).toHaveBeenCalledWith(expect.stringContaining('DELETE FROM forms'));
			expect(mockDb.bind).toHaveBeenCalledWith(1);
			expect(mockDb.run).toHaveBeenCalled();
			expect(result).toBe(true);
		});

		it('should return false when data not found', async () => {
			const mockResult = { meta: { changes: 0 } };

			mockDb.run.mockResolvedValue(mockResult);

			const result = await deleteFormData(mockDb, 999);

			expect(result).toBe(false);
		});
	});
});
