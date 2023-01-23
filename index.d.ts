/// <reference types="node" />
import { ExecOptions, SpawnOptions } from 'child_process';
type CafeObject<T = unknown> = Record<string, T>;
declare function mkdirp(path: string): Promise<void>;
declare function writeUtf8FileAsync(path: string, content: string): Promise<void>;
declare function putFile(path: string, content: string): Promise<void>;
declare function readUtf8FileAsync(path: string): Promise<string>;
declare function readJsonAsync(path: string): Promise<CafeObject>;
declare function writeJsonAsync(path: string, object: CafeObject, prettify?: boolean): Promise<void>;
declare function readLinesAsync(path: string): Promise<string[]>;
declare function readMatchingLines(path: string, filterFn: (matcher: string) => boolean): Promise<string[]>;
declare function readNonEmptyLines(path: string): Promise<string[]>;
declare function readCsv(path: string, skip?: number, delimiter?: string, quote?: string): Promise<string[][]>;
declare function walkTreeAsync(path: string): AsyncIterable<string>;
declare function readdirDeepAsync(path: string, cwd?: string): Promise<string[]>;
declare function existsAsync(path: string): Promise<boolean>;
declare function getFileSize(path: string): Promise<number>;
declare function getDirectorySize(path: string): Promise<number>;
declare function getChecksum(data: string): string;
declare function getChecksumOfFile(path: string): Promise<string>;
declare function createLogger(module: string): {
    trace: (...pieces: any[]) => void;
    info: (...pieces: any[]) => void;
    warn: (...pieces: any[]) => void;
    error: (...pieces: any[]) => void;
    errorObject: (error: any, stackTrace?: boolean) => void;
};
declare function enableFileLogging(path: string): void;
declare function execAsync(command: string, resolveWithErrors?: boolean, inherit?: boolean, options?: ExecOptions): Promise<{
    stdout: string | Buffer;
    stderr: string | Buffer;
    error?: string | Error;
}>;
declare function runProcess(command: string, args?: string[], options?: SpawnOptions, onStdout?: (chunk: string | Buffer | Error) => void, onStderr?: (chunk: string | Buffer | Error) => void): Promise<number>;
interface HeapMegabytes {
    used: string;
    total: string;
    rss: string;
}
declare function getHeapMegabytes(): HeapMegabytes;
export declare const Exec: {
    execAsync: typeof execAsync;
    getHeapMegabytes: typeof getHeapMegabytes;
    runProcess: typeof runProcess;
};
export declare const Files: {
    existsAsync: typeof existsAsync;
    writeJsonAsync: typeof writeJsonAsync;
    writeUtf8FileAsync: typeof writeUtf8FileAsync;
    putFile: typeof putFile;
    readdirDeepAsync: typeof readdirDeepAsync;
    readUtf8FileAsync: typeof readUtf8FileAsync;
    readJsonAsync: typeof readJsonAsync;
    readLinesAsync: typeof readLinesAsync;
    readMatchingLines: typeof readMatchingLines;
    readNonEmptyLines: typeof readNonEmptyLines;
    readCsv: typeof readCsv;
    walkTreeAsync: typeof walkTreeAsync;
    getFileSize: typeof getFileSize;
    getDirectorySize: typeof getDirectorySize;
    getChecksum: typeof getChecksum;
    getChecksumOfFile: typeof getChecksumOfFile;
    mkdirp: typeof mkdirp;
};
export declare const Logger: {
    create: typeof createLogger;
    enableFileLogging: typeof enableFileLogging;
};
export {};
