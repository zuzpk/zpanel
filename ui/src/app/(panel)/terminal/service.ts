// terminalService.ts
import { TerminalHandler } from '@zuzjs/ui';

class TerminalManager {
    private static instance: TerminalManager;
    public handler: TerminalHandler | null = null;
    public isInitialized = false;

    private constructor() {}

    static getInstance() {
        if (!TerminalManager.instance) {
            TerminalManager.instance = new TerminalManager();
        }
        return TerminalManager.instance;
    }

    // Attach the UI ref to our singleton
    setHandler(handler: TerminalHandler | null) {
        this.handler = handler;
    }

    write(msg: string) {
        if (this.handler) {
            this.handler.write(msg);
        }
    }
}

export const terminalService = TerminalManager.getInstance();