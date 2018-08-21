import { promise, protractor, browser } from 'protractor';

import { IApp } from '../../frontend/app/core/cf-api.types';
import { APIResource } from '../../frontend/app/store/types/api.types';
import { e2e } from '../e2e';
import { ConsoleUserType } from '../helpers/e2e-helpers';
import { ConfirmDialogComponent } from '../po/confirm-dialog';
import { ApplicationE2eHelper } from './application-e2e-helpers';
import { ApplicationPageRoutesTab } from './po/application-page-routes.po';
import { CreateRoutesPage } from './po/routes-create-page.po';

describe('Application Routes -', () => {

  let applicationE2eHelper: ApplicationE2eHelper;
  let cfGuid, app: APIResource<IApp>;

  beforeAll(() => {
    const setup = e2e.setup(ConsoleUserType.user)
      .clearAllEndpoints()
      .registerDefaultCloudFoundry()
      .connectAllEndpoints(ConsoleUserType.user)
      .connectAllEndpoints(ConsoleUserType.admin)
      .getInfo();
    applicationE2eHelper = new ApplicationE2eHelper(setup);
    protractor.promise.controlFlow().execute(() => {
      const defaultCf = e2e.secrets.getDefaultCFEndpoint();
      // Only available until after `info` call has completed as part of setup
      cfGuid = e2e.helper.getEndpointGuid(e2e.info, defaultCf.name);
      applicationE2eHelper.createApp(
        cfGuid,
        e2e.secrets.getDefaultCFEndpoint().testOrg,
        e2e.secrets.getDefaultCFEndpoint().testSpace,
        ApplicationE2eHelper.createApplicationName(),
        defaultCf
      ).then(appl => app = appl);
    });
  });


  function spaceContainsRoute(spaceGuid: string, host: string, path: string): promise.Promise<boolean> {
    return applicationE2eHelper.cfHelper.fetchRoutesInSpace(cfGuid, spaceGuid)
      .then(routes => !!routes.filter(route => route.entity.host === host && route.entity.path === '/' + path).length);
  }

  function testCreateNewRoute(appRoutes: ApplicationPageRoutesTab): { newRouteHostName: string, newRoutePath: string } {
    expect(appRoutes.list.header.getAdd().isDisplayed()).toBeTruthy();
    appRoutes.list.header.getAdd().click();

    const addRoutePage = new CreateRoutesPage(cfGuid, app.metadata.guid, app.entity.space_guid);
    expect(addRoutePage.isActivePage()).toBeTruthy();
    expect(addRoutePage.header.getTitleText()).toBe('Create Route');
    expect(addRoutePage.type.getSelected().getText()).toBe('Create and map new route');

    expect(addRoutePage.stepper.canNext()).toBeFalsy();
    const httpRouteForm = addRoutePage.getHttpForm();
    httpRouteForm.fill({
      host: 'something',
    });
    expect(addRoutePage.stepper.canNext()).toBeTruthy();
    httpRouteForm.clearField('host');
    expect(addRoutePage.stepper.canNext()).toBeFalsy();

    const newRouteHostName = '0-' + ApplicationE2eHelper.createRouteName();
    const newRoutePath = 'thisIsAPath';
    httpRouteForm.fill({
      host: newRouteHostName,
      path: newRoutePath
    });
    expect(addRoutePage.stepper.canNext()).toBeTruthy();
    addRoutePage.stepper.next();

    // Check new route exists in table
    appRoutes.waitForPage();
    expect(appRoutes.list.empty.getDefault().isPresent()).toBeFalsy();
    expect(appRoutes.list.empty.getDefault().getComponent().isPresent()).toBeFalsy();
    expect(appRoutes.list.empty.getCustom().getComponent().isPresent()).toBeFalsy();

    expect(appRoutes.list.table.getRows().count()).toBe(1);
    appRoutes.list.table.getCell(0, 1).getText().then(route => {
      expect(route).toBeTruthy();
      expect(route.startsWith(newRouteHostName)).toBeTruthy();
      expect(route.endsWith('/' + newRoutePath)).toBeTruthy();
      expect(spaceContainsRoute(app.entity.space_guid, newRouteHostName, newRoutePath)).toBeTruthy();
    });
    expect(appRoutes.list.table.getCell(0, 2).getText()).toBe('No');
    return {
      newRouteHostName,
      newRoutePath
    };
  }

  function testUnmapOfNewRoute(appRoutes: ApplicationPageRoutesTab, newRouteHostName: string, newRoutePath: string) {
    const unmapActionMenu = appRoutes.list.table.openRowActionMenuByIndex(0);
    unmapActionMenu.waitUntilShown();
    unmapActionMenu.clickItem('Unmap');
    const confirm = new ConfirmDialogComponent();
    confirm.getMessage().then(message => {
      expect(message).toBeTruthy();
      expect(message.indexOf(newRouteHostName)).toBeGreaterThanOrEqual(0);
      expect(message.indexOf('/' + newRoutePath)).toBeGreaterThanOrEqual(0);
    });
    confirm.confirm();
    confirm.waitUntilNotShown();

    appRoutes.list.header.getRefreshListButton().click().then(() => {
      expect(appRoutes.list.empty.getCustom().isDisplayed()).toBeTruthy();
      expect(appRoutes.list.empty.getCustomLineOne()).toBe('This application has no routes');

      expect(spaceContainsRoute(app.entity.space_guid, newRouteHostName, newRoutePath)).toBeTruthy();
    });
  }

  function testMapExistingRoute(appRoutes: ApplicationPageRoutesTab, routeHostName: string, routePath: string) {
    const addRoutePage = new CreateRoutesPage(cfGuid, app.metadata.guid, app.entity.space_guid);

    // Bind the just unbound route back to app
    expect(appRoutes.list.header.getAdd().isDisplayed()).toBeTruthy();
    appRoutes.list.header.getAdd().click();

    expect(addRoutePage.isActivePage()).toBeTruthy();
    expect(addRoutePage.stepper.canNext()).toBeFalsy();
    expect(addRoutePage.type.getSelected().getText()).toBe('Create and map new route');
    addRoutePage.type.select(1);

    const mapExistingRoutesList = addRoutePage.getMapExistingList();
    mapExistingRoutesList.header.getRefreshListButton().click();

    // Find the row index of the route that's just been unbound
    const rowIndexP = mapExistingRoutesList.table.getTableData().then(rows =>
      rows.findIndex(row => row['route'].startsWith(routeHostName) && row['route'].endsWith('/' + routePath))
    );

    expect(rowIndexP).toBeGreaterThanOrEqual(0);

    const restOfTest = rowIndexP.then(rowIndex => {
      mapExistingRoutesList.table.selectRow(rowIndex);
      expect(addRoutePage.stepper.canNext()).toBeTruthy();
      addRoutePage.stepper.next();

      // Check bound route exists in table
      appRoutes.waitForPage();
      expect(appRoutes.list.empty.getDefault().isPresent()).toBeFalsy();
      expect(appRoutes.list.empty.getDefault().getComponent().isPresent()).toBeFalsy();
      expect(appRoutes.list.empty.getCustom().getComponent().isPresent()).toBeFalsy();

      expect(appRoutes.list.table.getRows().count()).toBe(1);
      appRoutes.list.table.getCell(0, 1).getText().then(route => {
        expect(route).toBeTruthy();
        expect(route.startsWith(routeHostName)).toBeTruthy();
        expect(route.endsWith('/' + routePath)).toBeTruthy();
      });
      expect(appRoutes.list.table.getCell(0, 2).getText()).toBe('No');
    });

  }

  function testDeleteOfRoute(appRoutes: ApplicationPageRoutesTab, routeHostName: string, routePath: string) {
    expect(appRoutes.isActivePage()).toBeTruthy();

    const deleteActionMenu = appRoutes.list.table.openRowActionMenuByIndex(0);
    deleteActionMenu.waitUntilShown();
    deleteActionMenu.clickItem('Delete');
    const confirm = new ConfirmDialogComponent();
    confirm.getMessage().then(message => {
      expect(message).toBeTruthy();
      expect(message.indexOf(routeHostName)).toBeGreaterThanOrEqual(0);
      expect(message.indexOf('/' + routePath)).toBeGreaterThanOrEqual(0);
    });
    confirm.confirm();
    confirm.waitUntilNotShown();

    appRoutes.list.header.getRefreshListButton().click();

    expect(appRoutes.list.empty.getCustom().isDisplayed()).toBeTruthy();
    expect(appRoutes.list.empty.getCustomLineOne()).toBe('This application has no routes');

    expect(spaceContainsRoute(app.entity.space_guid, routeHostName, routePath)).toBeFalsy();
  }


  it('Add a new route', () => {

    const appRoutes = new ApplicationPageRoutesTab(cfGuid, app.metadata.guid);
    appRoutes.navigateTo();

    // Check empty initial state
    expect(appRoutes.list.empty.getDefault().isPresent()).toBeFalsy();
    expect(appRoutes.list.empty.getDefault().getComponent().isPresent()).toBeFalsy();
    expect(appRoutes.list.empty.getCustom().getComponent().isDisplayed()).toBeTruthy();
    expect(appRoutes.list.empty.getCustomLineOne()).toBe('This application has no routes');

    // All these tests are designed to lead on from each other.
    const { newRouteHostName, newRoutePath } = testCreateNewRoute(appRoutes);
    testUnmapOfNewRoute(appRoutes, newRouteHostName, newRoutePath);
    testMapExistingRoute(appRoutes, newRouteHostName, newRoutePath);
    testDeleteOfRoute(appRoutes, newRouteHostName, newRoutePath);

  });

  afterAll(() => {
    if (app) {
      applicationE2eHelper.deleteApplication({ cfGuid, app });
    }
  });
});
