import fs from 'fs';
import path from 'path';

const pages = [
  'src/modules/clients/pages/ClientDetailsPage.tsx',
  'src/modules/clients/pages/ClientsPage.tsx',
  'src/modules/settings/pages/SettingsPage.tsx',
  'src/modules/home/pages/HomePage.tsx',
  'src/modules/maintenances/pages/MaintenancesPage.tsx',
  'src/modules/auth/pages/RegisterPage.tsx',
  'src/modules/auth/pages/LoginPage.tsx',
  'src/modules/schedules/pages/SchedulesPage.tsx',
  'src/modules/locations/pages/LocationsPage.tsx',
  'src/modules/users/pages/UsersPage.tsx',
  'src/modules/rounds/pages/RoundDetailPage.tsx',
  'src/modules/rounds/pages/RoundsPage.tsx',
  'src/modules/kardex/pages/KardexPage.tsx',
  'src/modules/routes/pages/RoutesPage.tsx',
  'src/modules/routes/pages/CreateRoutePage.tsx',
  'src/modules/guards/pages/GuardsPage.tsx',
  'src/modules/incidents/pages/IncidentsPage.tsx',
];

pages.forEach((pagePath) => {
  const dir = path.dirname(pagePath);
  const baseName = path.basename(pagePath, '.tsx');
  const testFileName = `${baseName}.test.tsx`;
  const testFilePath = path.join(dir, testFileName);

  const testContent = `import { render, screen } from '@app/core/utils/test-utils';
import ${baseName} from './${baseName}';
import '@testing-library/jest-dom';

describe('${baseName}', () => {
  it('renders without crashing', () => {
    render(<${baseName} />);
    expect(document.body).toBeTruthy();
  });
});
`;

  fs.writeFileSync(testFilePath, testContent);
  console.log(`Created ${testFilePath}`);
});
