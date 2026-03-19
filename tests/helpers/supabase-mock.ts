import { vi } from "vitest";

type MockResponse = { data: unknown; error: unknown; count?: number };

interface ChainableQuery {
  select: (...args: unknown[]) => ChainableQuery;
  insert: (data: unknown) => ChainableQuery;
  update: (data: unknown) => ChainableQuery;
  delete: () => ChainableQuery;
  upsert: (data: unknown) => ChainableQuery;
  eq: (col: string, val: unknown) => ChainableQuery;
  neq: (col: string, val: unknown) => ChainableQuery;
  in: (col: string, vals: unknown[]) => ChainableQuery;
  is: (col: string, val: unknown) => ChainableQuery;
  gt: (col: string, val: unknown) => ChainableQuery;
  lt: (col: string, val: unknown) => ChainableQuery;
  gte: (col: string, val: unknown) => ChainableQuery;
  lte: (col: string, val: unknown) => ChainableQuery;
  order: (col: string, opts?: unknown) => ChainableQuery;
  limit: (n: number) => ChainableQuery;
  range: (from: number, to: number) => ChainableQuery;
  single: () => Promise<MockResponse>;
  maybeSingle: () => Promise<MockResponse>;
  then: (resolve: (value: MockResponse) => void, reject?: (err: unknown) => void) => Promise<void>;
}

interface RpcConfig {
  [name: string]: MockResponse;
}

interface TableConfig {
  [table: string]: {
    select?: MockResponse;
    insert?: MockResponse;
    update?: MockResponse;
    delete?: MockResponse;
    upsert?: MockResponse;
  };
}

export function createMockSupabase() {
  const tableConfig: TableConfig = {};
  const rpcConfig: RpcConfig = {};

  function createChain(response: MockResponse): ChainableQuery {
    const chain: ChainableQuery = {
      select: () => chain,
      insert: () => chain,
      update: () => chain,
      delete: () => chain,
      upsert: () => chain,
      eq: () => chain,
      neq: () => chain,
      in: () => chain,
      is: () => chain,
      gt: () => chain,
      lt: () => chain,
      gte: () => chain,
      lte: () => chain,
      order: () => chain,
      limit: () => chain,
      range: () => chain,
      single: () => Promise.resolve(response),
      maybeSingle: () => Promise.resolve(response),
      then: (resolve, reject) => {
        try {
          resolve(response);
          return Promise.resolve();
        } catch (err) {
          if (reject) reject(err);
          return Promise.reject(err);
        }
      },
    };
    return chain;
  }

  const defaultResponse: MockResponse = { data: null, error: null };

  const client = {
    from: vi.fn((table: string) => {
      const config = tableConfig[table] || {};
      return {
        select: (..._args: unknown[]) => createChain(config.select || defaultResponse),
        insert: (_data: unknown) => createChain(config.insert || defaultResponse),
        update: (_data: unknown) => createChain(config.update || defaultResponse),
        delete: () => createChain(config.delete || defaultResponse),
        upsert: (_data: unknown) => createChain(config.upsert || defaultResponse),
      };
    }),
    rpc: vi.fn((name: string) => {
      const response = rpcConfig[name] || defaultResponse;
      return Promise.resolve(response);
    }),
    auth: {
      getUser: vi.fn(() =>
        Promise.resolve({ data: { user: null }, error: null })
      ),
    },
  };

  function mockTable(
    table: string,
    operation: "select" | "insert" | "update" | "delete" | "upsert",
    response: MockResponse
  ) {
    if (!tableConfig[table]) tableConfig[table] = {};
    tableConfig[table][operation] = response;
  }

  function mockRpc(name: string, response: MockResponse) {
    rpcConfig[name] = response;
  }

  function reset() {
    Object.keys(tableConfig).forEach((k) => delete tableConfig[k]);
    Object.keys(rpcConfig).forEach((k) => delete rpcConfig[k]);
    client.from.mockClear();
    client.rpc.mockClear();
    client.auth.getUser.mockClear();
  }

  return { client, mockTable, mockRpc, reset };
}

export type MockSupabaseClient = ReturnType<typeof createMockSupabase>["client"];
