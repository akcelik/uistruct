import { TestBed, ComponentFixture } from '@angular/core/testing';
import { Component } from '@angular/core';
import { StrctContextMenuTrigger } from './menu';

@Component({
  template: `<div [strctContextMenu]="[]">Trigger</div>`,
  imports: [StrctContextMenuTrigger],
})
class TestHost {}

describe('StrctContextMenuTrigger', () => {
  it('exists as a directive', () => {
    TestBed.configureTestingModule({
      imports: [TestHost],
    });
    const fixture: ComponentFixture<TestHost> = TestBed.createComponent(TestHost);
    fixture.detectChanges();

    const div = fixture.nativeElement.querySelector('div');
    expect(div).toBeTruthy();
  });
});
