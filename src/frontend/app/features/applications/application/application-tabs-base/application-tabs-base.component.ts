import { EndpointsService } from './../../../../core/endpoints.service';
import { EndpointSchema } from './../../../../store/actions/endpoint.actions';
import { take, first } from 'rxjs/operators';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Rx';

import { MetricsMetatdata } from '../../../../app.component';
import { EntityService } from '../../../../core/entity-service';
import { ConfirmationDialog, ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';
import { GetAppStatsAction, GetAppSummaryAction } from '../../../../store/actions/app-metadata.actions';
import { DeleteApplication } from '../../../../store/actions/application.actions';
import { RouterNav } from '../../../../store/actions/router.actions';
import { AppState } from '../../../../store/app-state';
import { APIResource } from '../../../../store/types/api.types';
import { ApplicationService } from '../../application.service';

// Confirmation dialogs
const appStopConfirmation = new ConfirmationDialog(
  'Stop Application',
  'Are you sure you want to stop this Application?',
  'Stop'
);
const appStartConfirmation = new ConfirmationDialog(
  'Start Application',
  'Are you sure you want to start this Application?',
  'Start'
);

// App delete will have a richer delete experience
const appDeleteConfirmation = new ConfirmationDialog(
  'Delete Application',
  'Are you sure you want to delete this Application?',
  'Delete'
);

@Component({
  selector: 'app-application-tabs-base',
  templateUrl: './application-tabs-base.component.html',
  styleUrls: ['./application-tabs-base.component.scss']
})
export class ApplicationTabsBaseComponent implements OnInit, OnDestroy {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private applicationService: ApplicationService,
    private entityService: EntityService<APIResource>,
    private store: Store<AppState>,
    private confirmDialog: ConfirmationDialogService,
    private endpointsService: EndpointsService
  ) {
    this.tabLinks = [
      { link: 'summary', label: 'Summary' },
      { link: 'instances', label: 'Instances' },
      { link: 'log-stream', label: 'Log Stream' },
      { link: 'services', label: 'Services' },
      { link: 'variables', label: 'Variables' },
      { link: 'events', label: 'Events' }
    ];
    this.endpointsService.hasMetrics(applicationService.cfGuid).subscribe(hasMetrics => {
      if (hasMetrics) {
        this.tabLinks.push({
          link: 'metrics',
          label: 'Metrics'
        })
      }
    })
    this.applicationService.applicationStratProject$
      .pipe(first())
      .subscribe(stratProject => {
        if (
          stratProject &&
          stratProject.deploySource &&
          stratProject.deploySource.type === 'github'
        ) {
          this.tabLinks.push({ link: 'github', label: 'GitHub' });
        }
      });
  }

  public async: any;

  isFetching$: Observable<boolean>;
  application;
  applicationActions$: Observable<string[]>;
  addedGitHubTab = false;
  summaryDataChanging$: Observable<boolean>;
  appSub$: Subscription;
  entityServiceAppRefresh$: Subscription;
  autoRefreshString = 'auto-refresh';

  autoRefreshing$ = this.entityService.updatingSection$.map(
    update => update[this.autoRefreshString] || { busy: false }
  );

  tabLinks: { link: string, label: string }[];

  stopApplication() {
    this.confirmDialog.open(appStopConfirmation, () => {
      const stoppedString = 'STOPPED';
      this.applicationService.updateApplication({ state: stoppedString }, []);
      this.pollEntityService('stopping', stoppedString).subscribe();
    });
  }

  pollEntityService(state, stateString) {
    return this.entityService
      .poll(1000, state)
      .takeWhile(({ resource, updatingSection }) => {
        return resource.entity.state !== stateString;
      });
  }

  startApplication() {
    this.confirmDialog.open(appStartConfirmation, () => {
      const startedString = 'STARTED';
      this.applicationService.updateApplication({ state: startedString }, []);
      this.pollEntityService('starting', startedString)
        .delay(1)
        .subscribe();
    });
  }

  deleteApplication() {
    this.confirmDialog.open(appDeleteConfirmation, () => {
      this.store.dispatch(
        new DeleteApplication(
          this.applicationService.appGuid,
          this.applicationService.cfGuid
        )
      );
    });
  }

  ngOnInit() {
    const { cfGuid, appGuid } = this.applicationService;
    // Auto refresh
    this.entityServiceAppRefresh$ = this.entityService
      .poll(10000, this.autoRefreshString)
      .do(({ resource }) => {
        this.store.dispatch(new GetAppSummaryAction(appGuid, cfGuid));
        if (resource && resource.entity && resource.entity.state === 'STARTED') {
          this.store.dispatch(new GetAppStatsAction(appGuid, cfGuid));
        }
      })
      .subscribe();

    this.appSub$ = this.applicationService.app$.subscribe(app => {
      if (
        app.entityRequestInfo.deleting.deleted ||
        app.entityRequestInfo.error
      ) {
        this.store.dispatch(new RouterNav({ path: ['applications'] }));
      }
    });

    this.isFetching$ = this.applicationService.isFetchingApp$;

    const initialFetch$ = Observable.combineLatest(
      this.applicationService.isFetchingApp$,
      this.applicationService.isFetchingEnvVars$,
      this.applicationService.isFetchingStats$
    )
      .map(([isFetchingApp, isFetchingEnvVars, isFetchingStats]) => {
        return isFetchingApp || isFetchingEnvVars || isFetchingStats;
      });

    this.summaryDataChanging$ = Observable.combineLatest(
      initialFetch$,
      this.applicationService.isUpdatingApp$,
      this.autoRefreshing$
    ).map(([isFetchingApp, isUpdating, autoRefresh]) => {
      if (autoRefresh.busy) {
        return false;
      }
      return !!(isFetchingApp || isUpdating);
    });
  }

  ngOnDestroy() {
    this.appSub$.unsubscribe();
    this.entityServiceAppRefresh$.unsubscribe();
  }
}
