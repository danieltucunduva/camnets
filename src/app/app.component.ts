import {Component, OnInit, ViewChild} from '@angular/core';
import {Router} from "@angular/router";
import {MatTabChangeEvent} from "@angular/material";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'app';
  public navigating = false;

  public selectedIndex = 0;

  private router: Router;

  constructor(router: Router) {
    this.router = router;
  }

  ngOnInit() {
    this.selectedIndex = 0;
    this.navigate({index: 0});
  }

  navigate(event: {index: number}) {
    this.navigating = true;
    setTimeout(() => {
      switch (event.index) {
        case 0:
          this.router.navigateByUrl('/about');
          break;
        case 1:
          this.router.navigateByUrl('/face-tracking');
          break;
        case 2:
          this.router.navigateByUrl('/keypoints');
          break;
      }
      this.navigating = false;
    }, 500);
  }
}
