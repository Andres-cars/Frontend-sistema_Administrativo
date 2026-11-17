import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormAula } from './form-aula';

describe('FormAula', () => {
  let component: FormAula;
  let fixture: ComponentFixture<FormAula>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [FormAula],
    }).compileComponents();

    fixture = TestBed.createComponent(FormAula);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
