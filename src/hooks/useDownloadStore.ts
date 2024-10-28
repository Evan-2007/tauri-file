import { create } from 'zustand';

interface downloadStore {
    downloads: download [];
    addDownload: (download: download) => void;

}

interface download {
    id: number;
    url: string;
    is_downloaded: string;
    status: string;
    path: string;
}


export const useDownloadStore = create<downloadStore>((set) => ({
    downloads: [

    ],
    addDownload: (download) => set((state) => ({downloads: [...state.downloads, download]})),
    setDownloads: (downloads: download[]) => set(state => ({downloads: downloads})),
}));