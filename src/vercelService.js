const API_BASE = '/api';

const sanitizeText = (text) => {
    if (!text) return text;
    return text.replace(/[\u200B-\u200D\uFEFF]/g, '');
};

const defaultHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache'
};

export const getMessages = async () => {
    try {
        const response = await fetch(`${API_BASE}/messages`, {
            headers: defaultHeaders,
            cache: 'no-store'
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const saveMessage = async (messageData) => {
    try {
        const sanitizedMessage = {
            ...messageData,
            name: sanitizeText(messageData.name),
            message: sanitizeText(messageData.message)
        };

        const response = await fetch(`${API_BASE}/messages`, {
            method: 'POST',
            headers: defaultHeaders,
            body: JSON.stringify(sanitizedMessage),
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        throw error;
    }
};

export const uploadImage = async (base64Data) => {
    try {
        const response = await fetch(`${API_BASE}/upload-image`, {
            method: 'POST',
            headers: defaultHeaders,
            body: JSON.stringify({ image: base64Data }),
            cache: 'no-store'
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const { url } = await response.json();
        return url;
    } catch (error) {
        throw error;
    }
};

export const saveMessageWithImage = async (messageData, base64ImageData) => {
    try {
        const imageUrl = await uploadImage(base64ImageData);
        const messageWithImage = {
            ...messageData,
            imageUrl,
            hasImage: true,
        };

        return await saveMessage(messageWithImage);
    } catch (error) {
        throw error;
    }
};