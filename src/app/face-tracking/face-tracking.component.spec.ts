import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {FaceTrackingComponent} from './face-tracking.component';

describe('FaceTrackingComponent', () => {
  let component: FaceTrackingComponent;
  let fixture: ComponentFixture<FaceTrackingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [FaceTrackingComponent]
    })
      .overrideTemplate(FaceTrackingComponent, '');
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FaceTrackingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
});
