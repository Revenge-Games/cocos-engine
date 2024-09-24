import downloadFile, { FileProgressCallback } from './download-file';

export interface DownloadFile {
    url: string
    options: Record<string, any>
    onProgress: FileProgressCallback | null | undefined
    onComplete: ((err: Error | null, data?: any) => void)
}

export class DownloadErrorManager {
    private files: any[] = [];
    private retryCount = 0;
    private maxRetryCount = 5;
    private retryIntervalTimeOuts: number[] = [4000, 8000, 8000, 8000, 8000];
    private timeoutRetry;
    private finishLoad = false;
    enabled = false;
    complete = 0;

    private lstFile: string[] = [];
    private lstFileError: string[] = [];
    private lstFileSuccess: string[] = [];

    constructor() {
        console.log('DownloadErrorManager constructor');
        window.down = this;
        window.addEventListener('CUSTOM_DOWLOAD_ENABLE',  this.onEnable.bind(this));
        window.addEventListener('CUSTOM_DOWLOAD_FINISH',  this.onFinishDowload.bind(this));
        window.addEventListener('CUSTOM_DOWLOAD_RESET',  this.onReset.bind(this));
    }

    onEnable(event: any){
        let enable = event.detail.enable;
        if(enable){
            if(!this.enabled){
                console.log('DownloadErrorManager onEnable ', event);
                this.enabled = true;
                this.lisenOfflineEvent();
            }
        }else{
            this.enabled = false;
            clearTimeout(this.timeoutRetry);
        }
    }

    lisenOfflineEvent(){
        window.addEventListener('offline', this.onOffline.bind(this));
    }

    onOffline(){
        console.log('DownloadErrorManager offline');
        if(this.finishLoad) return;
        if(this.retryCount >= this.maxRetryCount) return;
        this.timeoutRetry = setTimeout(this.retry.bind(this), this.retryIntervalTimeOuts[this.retryCount]);
    }

    onFinishDowload(): void {
        console.log('DownloadErrorManager onFinishDowload ')
        this.finishLoad = true;
        window.removeEventListener('offline', this.onOffline.bind(this));
        window.removeEventListener('CUSTOM_DOWLOAD_ENABLE', this.onEnable.bind(this));
        window.removeEventListener('CUSTOM_DOWLOAD_FINISH', this.onFinishDowload.bind(this));
        window.removeEventListener('CUSTOM_DOWLOAD_RESET',  this.onReset.bind(this));
    }
    
    addDownloadFile(file: any): void {
        // if(!this.enabled) return;
        const pos = this.files.map(f => f.url).indexOf(file.url);
        if(pos == -1){
            this.files.push(file);
            this.lstFile.push(file.url);
            this.lstFileError.push(file.url);
        }else{
            console.log('addDownloadFile already exist ', file.url);
        }
        
    }

    getErrorFiles(): any[] {
        let out:any[] = [];
        for (const file of this.files) {
            console.log('getErrorFiles ', file.xhr.status);
            if (file.xhr.status !== 200) {
                out.push(file);
            }
        }
        return out;
    }

    removeErrorFiles(): void {
        this.files = this.files.filter((file) => file.xhr.status === 200);
    }

    private retry(): void {
        console.log(`%cDownloadErrorManager retry ${this.retryCount}`, 'background: #ffe6cc;');
        if(this.finishLoad) return;
        this.retryCount++;
        if(this.retryCount < this.maxRetryCount){
            setTimeout(this.retry.bind(this), this.retryIntervalTimeOuts[this.retryCount]);
        }else{
            window.dispatchEvent(new CustomEvent('CUSTOM_DOWLOAD_RETRY', {'detail': {'status': false, 'retryCount': this.retryCount}}));
            console.log('DownloadErrorManager retry failed');
            return;
        }
        window.dispatchEvent(new CustomEvent('CUSTOM_DOWLOAD_RETRY', {'detail': {'status': true, 'retryCount': this.retryCount}}));
        if (navigator.onLine) {
        //    let getErrorFiles = this.getErrorFiles();
        //    this.removeErrorFiles();
        //     for (const file of getErrorFiles) {
        //         console.log(`%cDownloadErrorManager retry ${file.url} ${file.xhr.status}`, 'background: #ffe6cc;');
        //         file.xhr.abort();
        //         downloadFile(file.url, file.options, file.onProgress, file.onComplete);
        //     }
            for (const file of this.files) {
                if (file.xhr.status !== 200) {
                    file.xhr.abort();
                    downloadFile(file.url, file.options, file.onProgress, file.onComplete);
                    console.log(`%cDownloadErrorManager retry ${file.url} ${file.xhr.status}`, 'background: #ffe6cc;');
                }
            }
        }
    }

    private onReset(){
        this.retryCount = 0;
        this.retry();
    }

    onComplete(url){
        this.lstFileSuccess.push(url);
        const index = this.lstFileError.indexOf(url);
        if (index > -1) {
            this.lstFileError.splice(index, 1);
        }else{
            console.log('complete not in list error ', url);
        }
    }
}
export const downloadErrorManager = new DownloadErrorManager()