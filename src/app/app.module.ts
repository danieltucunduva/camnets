import {BrowserModule} from '@angular/platform-browser';
import {CUSTOM_ELEMENTS_SCHEMA, NgModule, NO_ERRORS_SCHEMA} from '@angular/core';

import {AppComponent} from './app.component';
import {KeypointsComponent} from './keypoints/keypoints.component';
import {MatButtonModule, MatFormFieldModule, MatInputModule, MatTabsModule} from "@angular/material";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {NoopAnimationsModule} from "@angular/platform-browser/animations";
import {FaceTrackingComponent} from "./face-tracking/face-tracking.component";
import {RouterModule, Routes} from "@angular/router";
import { AboutComponent } from './about/about.component';

const appRoutes: Routes = [
  { path: 'about', component: AboutComponent },
  { path: 'keypoints', component: KeypointsComponent },
  { path: 'face-tracking', component: FaceTrackingComponent },
  { path: '',
    redirectTo: '/about',
    pathMatch: 'full'
  }
];

@NgModule({
  declarations: [
    AppComponent,
    KeypointsComponent,
    FaceTrackingComponent,
    AboutComponent
  ],
  imports: [
    RouterModule.forRoot(appRoutes),
    BrowserModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    ReactiveFormsModule,
    NoopAnimationsModule,
    MatTabsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
