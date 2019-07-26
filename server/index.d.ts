/// Type definitions for server
// oauth-signature
declare module "oauth-signature" {
    export function generate(
        httpMethod: string,
        url: string,
        parameters: { [key: string]: string },
        consumerSecret: string,
        tokenSecret?: string,
        options?: { [key: string]: any }): string;
}

// Type definitions for manta@5.1.0
//
// Definitions by: eLIPSE, The University of Queensland (https://www.elipse.uq.edu.au)
type _ = any;

declare module "manta" {
    import * as stream from "stream";

    namespace auth {
        export function cliSigner(options: _): _;
        export function privateKeySigner(options: _): _;
        export function sshAgentSigner(options: _): _;
        export function loadSSHKey(fp: _, cb: _): void;
    }

    namespace cc {
        interface DefaultOptionOneName {
            name: string,
            type: string,
            help?: string,
            helpArg?: string,
            env?: string,
            default?: boolean,
            hidden?: boolean,
        }

        interface DefaultOptionManyNames {
            names: string[],
            type: string,
            help?: string,
            helpArg?: string,
            env?: string,
            default?: boolean,
            hidden?: boolean,
        }

        interface DefaultOptionGroup {
            group: string,
        }

        type DefaultOptions =
            (DefaultOptionOneName | DefaultOptionManyNames | DefaultOptionGroup)[];

        interface CreateClientOptionsRetry {
            minTimeout: number,
            maxTimeout: number,
            retries: number,
        }

        interface CreateClientOptions extends manta.ClientOptions {
            agent: _,
            rejectUnauthorized: _,
            retry: CreateClientOptionsRetry,
        }

        const DEFAULT_OPTIONS: DefaultOptions;
        function createClient(options: Partial<CreateClientOptions>): manta.MantaClient;
        function createClientFromFileSync(filename: string, log: _): manta.MantaClient;
        function checkBinEnv(opts: _): void;
        function cloneOptions(options: Partial<CreateClientOptions>): Partial<CreateClientOptions>;
        function createBinClient(opts: _): _;
        function usage(parser: _, errmsg: _, extra: _): void;
        function setupLogger(opts: _, log: _): _;
        function versionCheckPrintAndExit(opts: _): void;
        function completionCheckPrintAndExit(opts: _, parser: _, name: string, argtypes?: string[]): void;
    }

    namespace manta {
        interface ClientOptions {
            connectTimeout: number,
            headers?: { [key: string]: string },
            socketPath: string,
            url: string,
            user: string,
            subuser: string | null,
            role: string[],
            sign: _,
        }

        type JobConfiguration = string | string[] | Object;

        class MantaClient {
            constructor(options: ClientOptions);

            close(): void;
            signRequest(opts: _, cb: _): void;
            toString(): string;
            chattr(p: string, cb: _): void;
            chattr(p: string, opts: _, cb: _): void;
            get(p: string, cb: _): void;
            get(p: string, opts: _, cb: _): void;
            createReadStream(p: string, opts?: _): stream.PassThrough;
            ftw(p: string, cb: _): void;
            ftw(p: string, opts: _, cb: _): void;
            info(p: string, cb: _): void;
            info(p: string, opts: _, cb: _): void;
            ln(src: string, p: string, cb: _): void;
            ln(src: string, p: string, opts: _, cb: _): void;
            createListStream(dir: string, opts?: _): _;
            ls(dir: string, cb: _): void;
            ls(dir: string, opts: _, cb: _): void;
            mkdir(dir: string, cb: _): void;
            mkdir(dir: string, opts: _, cb: _): void;
            mkdirp(dir: string, cb: _): void;
            mkdirp(dir: string, opts: _, cb: _): void;
            put(p: string, input: stream.Readable, cb: _): void;
            put(p: string, input: stream.Readable, opts: _, cb: _): void;
            createWriteStream(p: string, opts?: _): stream.Writable;
            rmr(p: string, cb: _): void;
            rmr(p: string, opts: _, cb: _): void;
            unlink(p: string, cb: _): void;
            unlink(p: string, opts: _, cb: _): void;
            createJob(j: JobConfiguration, cb: _): void;
            createJob(j: JobConfiguration, opts: _, cb: _): void;
            job(j: string, cb: _): void;
            job(j: string, opts: _, cb: _): void;
            listJobs(cb: _): void;
            listJobs(opts: _, cb: _): void;
            jobs(cb: _): void;
            jobs(opts: _, cb: _): void;
            addJobKey(j: string, k: string | string[], cb: _): void;
            addJobKey(j: string, k: string | string[], opts: _, cb: _): void;
            cancelJob(j: string, cb: _): void;
            cancelJob(j: string, opts: _, cb: _): void;
            endJob(j: string, cb: _): void;
            endJob(j: string, opts: _, cb: _): void;
            jobInput(j: string, cb: _): void;
            jobInput(j: string, opts: _, cb: _): void;
            jobOutput(j: string, cb: _): void;
            jobOutput(j: string, opts: _, cb: _): void;
            jobFailures(j: string, cb: _): void;
            jobFailures(j: string, opts: _, cb: _): void;
            jobErrors(j: string, cb: _): void;
            jobErrors(j: string, opts: _, cb: _): void;
            jobShare(j: string, cb: _): void;
            jobShare(j: string, opts: _, cb: _): void;
            signURL(opts: _, cb: _): void;
            /** @deprecated */
            signUrl(opts: _, cb: _): void;
            medusaAttach(j: string, cb: _): void;
            medusaAttach(j: string, opts: _, cb: _): void;
            path(p: string, skipEncode: boolean): string;
            createUpload(p: string, opts: _, cb: _): void;
            uploadPart(stream: stream.Readable, id: string, opts: _, cb: _): void;
            abortUpload(id: string, cb: _): void;
            abortUpload(id: string, opts: _, cb: _): void;
            getUpload(id: string, cb: _): void;
            getUpload(id: string, opts: _, cb: _): void;
            commitUpload(id: string, p: string, cb: _): void;
            commitUpload(id: string, p: string, opts: _, cb: _): void;
        }

        function getPath(p: string, skipEncode: boolean): string;
        function getPath(p: string, user: string, skipEncode: boolean): string;
        function getJobPath(p: string, user: string): string;

        const path: typeof getPath;
        const jobPath: typeof getJobPath;
    }

    namespace options {
        interface ParseOptionsOptions {
            name: string,
            parser: _,
            argTypes: string[],
            parseCmdOptions: _,
            log: _,
        }

        function parseOptions(args: ParseOptionsOptions): _;
    }

    namespace progbar {

    }

    namespace Queue {

    }

    namespace StringStream {

    }

    namespace utils {
        function escapePath(s: string): string;
    }

    export const Queue: _;
    export const StringStream: _;

    export const ProgressBar: _;

    export const MantaClient: typeof manta.MantaClient;
    export const createClient: typeof cc.createClient;
    export const createClientFromFileSync: typeof cc.createClientFromFileSync;
    export const checkBinEnv: typeof cc.checkBinEnv;
    export const cloneOptions: typeof cc.cloneOptions;
    export const createBinClient: typeof cc.createBinClient;
    export const DEFAULT_CLI_OPTIONS: typeof cc.DEFAULT_OPTIONS;
    export const cli_usage: typeof cc.usage;
    export const cli_logger: typeof cc.setupLogger;
    export const cliVersionCheckPrintAndExit: typeof cc.versionCheckPrintAndExit;
    export const cliCompletionCheckPrintAndExit: typeof cc.completionCheckPrintAndExit;

    export const cliSigner: typeof auth.cliSigner;
    export const privateKeySigner: typeof auth.privateKeySigner;
    export const sshAgentSigner: typeof auth.sshAgentSigner;
    export const signUrl: (opts: _, cb: _) => _;
    export const loadSSHKey: typeof auth.loadSSHKey;
    export const assertPath: (p: _, noThrow: _) => _;

    export const path: typeof manta.path;
    export const jobPath: typeof manta.jobPath;

    export const escapePath: typeof utils.escapePath;

    export const parseOptions: typeof options.parseOptions;
}
