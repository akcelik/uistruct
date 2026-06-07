import { Injectable } from '@angular/core';

export interface DcObject {
  id: string;
  name: string;
  type: string;
  status: 'running' | 'stopped' | 'warning' | 'maintenance';
  description: string;
  specs: Record<string, string>;
}

export const CATEGORIES: { id: string; label: string; icon: string }[] = [
  { id: 'compute', label: 'Compute', icon: 'cpu' },
  { id: 'vm', label: 'VM', icon: 'container' },
  { id: 'network', label: 'Network', icon: 'network' },
  { id: 'storage', label: 'Storage', icon: 'database' },
];

const DEFAULT_APPLIANCE: DcObject = {
  id: 'default-appliance',
  name: 'Default Appliance',
  type: 'Appliance',
  status: 'running',
  description:
    'This is the default landing appliance for the category. Select an object from the list to view its details.',
  specs: {
    Environment: 'Production',
    Region: 'us-east-1',
    'Managed by': 'Platform Team',
  },
};

export const MOCK_DATA: Record<string, DcObject[]> = {
  compute: [
    DEFAULT_APPLIANCE,
    {
      id: 'host-01',
      name: 'Hyper-V Host 01',
      type: 'Host',
      status: 'running',
      description: 'Primary compute host in rack A3.',
      specs: {
        CPU: '2× Intel Xeon Gold 6248R',
        RAM: '512 GB DDR4',
        Cores: '48',
        Hypervisor: 'Hyper-V Server 2022',
        Uptime: '124 days',
      },
    },
    {
      id: 'host-02',
      name: 'Hyper-V Host 02',
      type: 'Host',
      status: 'warning',
      description: 'Secondary compute host — fan redundancy alert.',
      specs: {
        CPU: '2× Intel Xeon Gold 6248R',
        RAM: '512 GB DDR4',
        Cores: '48',
        Hypervisor: 'Hyper-V Server 2022',
        Uptime: '14 days',
      },
    },
    {
      id: 'cluster-prod',
      name: 'Production Cluster',
      type: 'Cluster',
      status: 'running',
      description: 'HA-enabled failover cluster spanning 8 hosts.',
      specs: {
        Hosts: '8',
        'Total vCPUs': '384',
        'Total RAM': '4 TB',
        'Load balancing': 'Enabled',
        HA: 'Enabled',
      },
    },
  ],
  vm: [
    DEFAULT_APPLIANCE,
    {
      id: 'web-frontend-01',
      name: 'web-frontend-01',
      type: 'Virtual Machine',
      status: 'running',
      description: 'Angular SSR frontend instance.',
      specs: {
        OS: 'Ubuntu 22.04 LTS',
        vCPUs: '4',
        RAM: '16 GB',
        Disk: '120 GB',
        IP: '10.0.4.12',
      },
    },
    {
      id: 'api-gateway-01',
      name: 'api-gateway-01',
      type: 'Virtual Machine',
      status: 'running',
      description: 'Kong API gateway with rate-limiting.',
      specs: {
        OS: 'Ubuntu 22.04 LTS',
        vCPUs: '8',
        RAM: '32 GB',
        Disk: '200 GB',
        IP: '10.0.4.20',
      },
    },
    {
      id: 'db-primary',
      name: 'db-primary',
      type: 'Virtual Machine',
      status: 'maintenance',
      description: 'PostgreSQL primary — scheduled vacuum.',
      specs: {
        OS: 'RHEL 9',
        vCPUs: '16',
        RAM: '128 GB',
        Disk: '2 TB SSD',
        IP: '10.0.4.30',
      },
    },
  ],
  network: [
    DEFAULT_APPLIANCE,
    {
      id: 'vsw-prod-01',
      name: 'Switch-Prod-01',
      type: 'Virtual Switch',
      status: 'running',
      description: 'Virtual switch for production VLANs.',
      specs: {
        Uplinks: '4× 25 Gbps',
        MTU: '9000',
        VLANs: '12',
        'Teaming Policy': 'Route based on physical NIC load',
      },
    },
    {
      id: 'pg-web',
      name: 'PortGroup-Web',
      type: 'Port Group',
      status: 'running',
      description: 'Web tier VLAN (404) with promiscuous mode off.',
      specs: {
        VLAN: '404',
        Subnet: '10.0.4.0/24',
        'Active Ports': '24',
        'Security Policy': 'Restricted',
      },
    },
    {
      id: 'fw-edge-01',
      name: 'Edge Firewall 01',
      type: 'Firewall',
      status: 'running',
      description: 'Tier-0 edge firewall.',
      specs: {
        Rules: '340',
        Throughput: '10 Gbps',
        HA: 'Active/Standby',
        'NAT Tables': 'Enabled',
      },
    },
  ],
  storage: [
    DEFAULT_APPLIANCE,
    {
      id: 'ds-ssd-01',
      name: 'Volume-SSD-01',
      type: 'Volume',
      status: 'running',
      description: 'All-flash S2D volume — performance tier.',
      specs: {
        Capacity: '10 TB',
        Free: '3.2 TB',
        Type: 'S2D',
        'Disk Groups': '4',
        'IOPS (avg)': '~45k',
      },
    },
    {
      id: 'lun-san-01',
      name: 'LUN-SAN-01',
      type: 'LUN',
      status: 'running',
      description: 'FC-attached SAN LUN for database VMs.',
      specs: {
        Capacity: '5 TB',
        'RAID Level': 'RAID-10',
        Protocol: 'Fibre Channel',
        'LUN ID': '10',
        Masking: 'Host-group DB',
      },
    },
    {
      id: 'vol-backup-01',
      name: 'Backup Volume 01',
      type: 'Volume',
      status: 'stopped',
      description: 'NFS backup target — currently unmounted.',
      specs: {
        Capacity: '50 TB',
        Protocol: 'NFS v4.1',
        'Dedupe Ratio': '4.2:1',
        'Last Backup': '2026-06-04 02:00',
      },
    },
  ],
};

@Injectable({ providedIn: 'root' })
export class MockDataService {
  private readonly data = MOCK_DATA;

  getObjects(category: string): DcObject[] {
    return this.data[category] ?? [DEFAULT_APPLIANCE];
  }

  getObject(category: string, id: string): DcObject | undefined {
    return this.getObjects(category).find((o) => o.id === id);
  }
}
