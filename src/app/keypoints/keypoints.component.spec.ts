import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {KeypointsComponent} from './keypoints.component';

describe('FaceTrackingComponent', () => {
  let component: KeypointsComponent;
  let fixture: ComponentFixture<KeypointsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KeypointsComponent]
    })
      .overrideTemplate(KeypointsComponent, '');
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KeypointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });
});
