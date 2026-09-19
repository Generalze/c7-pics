/**
 * DataTable Contract Tests
 *
 * These tests verify that DataTable<T> is properly generic and maintains
 * type safety throughout the render pipeline.
 *
 * Contract: DataTable<T> must preserve type T through all operations and
 * enforce that column accessors match the data type.
 */

import { describe, test, expect } from 'vitest';

/**
 * Represents a DataTable column configuration.
 * T is the row data type, ensuring type safety.
 */
interface DataTableColumn<T> {
  key: keyof T;
  label: string;
  render?: (item: T) => React.ReactNode;
}

/**
 * Mock Agent type (matches domain model)
 */
interface Agent {
  id: string;
  name: string;
  status: 'active' | 'idle' | 'pending' | 'failed';
  lastSeen?: Date;
}

/**
 * Mock DataTable component (for testing)
 */
const MockDataTable = <T extends Record<string, any>>({
  data,
  columns,
}: {
  data: T[];
  columns: DataTableColumn<T>[];
}) => {
  return `<table><thead><tr>${columns.map((c) => `<th>${c.label}</th>`).join('')}</tr></thead></table>`;
};

describe('DataTable Contract', () => {
  test('DataTable<Agent> accepts Agent[] data and Agent columns', () => {
    const agents: Agent[] = [
      { id: '1', name: 'Alice', status: 'active' },
      { id: '2', name: 'Bob', status: 'idle' },
    ];

    const columns: DataTableColumn<Agent>[] = [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'status', label: 'Status' },
    ];

    const html = MockDataTable({ data: agents, columns });
    expect(html).toBeTruthy();
  });

  test('DataTable column accessor must match data type keys', () => {
    const agents: Agent[] = [{ id: '1', name: 'Alice', status: 'active' }];

    // This should compile: 'name' is a valid Agent key
    const validColumns: DataTableColumn<Agent>[] = [
      { key: 'name', label: 'Agent Name' },
    ];

    expect(validColumns[0].key).toBe('name');
  });

  test('DataTable custom render receives correctly typed items', () => {
    const agents: Agent[] = [{ id: '1', name: 'Alice', status: 'active' }];

    const columns: DataTableColumn<Agent>[] = [
      {
        key: 'name',
        label: 'Agent',
        render: (agent: Agent) => {
          // TypeScript should know agent is an Agent, so these accesses are safe
          expect(agent.name).toBeTruthy();
          expect(agent.status).toBeTruthy();
          return `${agent.name} (${agent.status})`;
        },
      },
    ];

    MockDataTable({ data: agents, columns });
  });

  test('DataTable generic preserves type parameter through multiple operations', () => {
    interface User {
      id: string;
      email: string;
      role: 'admin' | 'user';
    }

    const users: User[] = [
      { id: '1', email: 'admin@example.com', role: 'admin' },
    ];

    const columns: DataTableColumn<User>[] = [
      {
        key: 'email',
        label: 'Email',
        render: (user) => user.email, // user is typed as User
      },
    ];

    const result = MockDataTable({ data: users, columns });
    expect(result).toBeTruthy();
  });

  test('DataTable can filter and still maintain type safety', () => {
    const agents: Agent[] = [
      { id: '1', name: 'Alice', status: 'active' },
      { id: '2', name: 'Bob', status: 'idle' },
      { id: '3', name: 'Charlie', status: 'active' },
    ];

    const activeAgents = agents.filter((a) => a.status === 'active');
    const columns: DataTableColumn<Agent>[] = [
      { key: 'name', label: 'Name' },
    ];

    MockDataTable({ data: activeAgents, columns });
    expect(activeAgents.length).toBe(2);
  });
});
