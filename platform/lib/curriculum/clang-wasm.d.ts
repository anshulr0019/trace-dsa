declare module "@live-codes/clang-wasm" {
  export type Compiler = {
    run(code: string, input?: string): Promise<{
      stdout: string;
      stderr: string;
      errors: string[];
      exitCode: number | null;
    }>;
    dispose(): void;
  };
  export function createCompiler(language: "cpp", options: {
    baseUrl: URL;
    std: "gnu++17";
    fileName: string;
    compileArgs: string[];
  }): Promise<Compiler>;
}

declare module "@live-codes/clang-wasm/toolchain" {
  export function createToolchain(options: { baseUrl: URL }): Promise<{
    addFile(path: string, contents: string): void;
    dispose(): void;
  }>;
}
