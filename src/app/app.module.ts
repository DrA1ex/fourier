import {NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppComponent} from './app.component';
import { WaveSelectorComponent } from './components/wave-selector/wave-selector.component';

@NgModule({
  declarations: [
    AppComponent,
    WaveSelectorComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})

export class AppModule {
}
