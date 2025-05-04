import { UploadedFile } from "express-fileupload";

export async function convertToUploadedFile(file: File): Promise<UploadedFile> {
    const buffer = await file.arrayBuffer();
    return {
        name: file.name,
        data: Buffer.from(buffer),
        encoding: 'utf8',
        mimetype: file.type,
        mv: async (path: string) => {
            // This is a no-op since we're not actually moving files
            return Promise.resolve();
        },
        size: file.size,
        tempFilePath: '',
        truncated: false
    } as UploadedFile;
} 