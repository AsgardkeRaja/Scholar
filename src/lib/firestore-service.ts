import {
    collection,
    doc,
    setDoc,
    deleteDoc,
    getDocs,
    getDoc,
    query,
    orderBy,
    Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { type Paper } from '@/types';

/**
 * Get all bookmarks for a user
 */
export async function getUserBookmarks(userId: string): Promise<Paper[]> {
    if (!db) {
        console.warn('Firestore not initialized');
        return [];
    }

    try {
        const bookmarksRef = collection(db, 'users', userId, 'bookmarks');
        const q = query(bookmarksRef, orderBy('bookmarkedAt', 'desc'));
        const snapshot = await getDocs(q);

        return snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
                paperId: data.paperId,
                title: data.title,
                abstract: data.abstract || null,
                authors: data.authors || [],
                year: data.year || null,
                url: data.url || null,
                journal: data.journal || null,
                isOpenAccess: data.isOpenAccess || false,
            };
        });
    } catch (error) {
        console.error('Error fetching bookmarks:', error);
        throw error;
    }
}

/**
 * Sanitize paper ID for use as a Firestore document ID
 * Firestore document IDs cannot contain forward slashes
 */
function sanitizeId(id: string): string {
    return encodeURIComponent(id);
}

/**
 * Add a bookmark for a user
 */
export async function addBookmark(userId: string, paper: Paper): Promise<void> {
    if (!db) {
        console.warn('Firestore not initialized');
        return;
    }

    try {
        const bookmarkRef = doc(db, 'users', userId, 'bookmarks', sanitizeId(paper.paperId));
        await setDoc(bookmarkRef, {
            ...paper,
            bookmarkedAt: Timestamp.now(),
        });
    } catch (error) {
        console.error('Error adding bookmark:', error);
        throw error;
    }
}

/**
 * Remove a bookmark for a user
 */
export async function removeBookmark(userId: string, paperId: string): Promise<void> {
    if (!db) {
        console.warn('Firestore not initialized');
        return;
    }

    try {
        const bookmarkRef = doc(db, 'users', userId, 'bookmarks', sanitizeId(paperId));
        await deleteDoc(bookmarkRef);
    } catch (error) {
        console.error('Error removing bookmark:', error);
        throw error;
    }
}

/**
 * Check if a paper is bookmarked by a user
 */
export async function isBookmarked(userId: string, paperId: string): Promise<boolean> {
    if (!db) {
        console.warn('Firestore not initialized');
        return false;
    }

    try {
        const bookmarkRef = doc(db, 'users', userId, 'bookmarks', sanitizeId(paperId));
        const snapshot = await getDoc(bookmarkRef);
        return snapshot.exists();
    } catch (error) {
        console.error('Error checking bookmark:', error);
        return false;
    }
}

/**
 * Migrate bookmarks from localStorage to Firestore
 * This is a one-time operation when a user first logs in
 */
export async function migrateLocalStorageBookmarks(
    userId: string,
    papers: Paper[]
): Promise<void> {
    try {
        // Add all papers as bookmarks
        const promises = papers.map((paper) => addBookmark(userId, paper));
        await Promise.all(promises);

        console.log(`Migrated ${papers.length} bookmarks to Firestore`);
    } catch (error) {
        console.error('Error migrating bookmarks:', error);
        throw error;
    }
}
