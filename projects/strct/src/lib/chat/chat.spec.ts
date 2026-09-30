import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { StrctChatAttachment, StrctChatComposer, StrctChatMessage, StrctChatThread } from './chat';

@Component({
  imports: [StrctChatThread, StrctChatMessage, StrctChatAttachment, StrctChatComposer],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <strct-chat-thread [busy]="busy()" label="Assistant conversation">
      <strct-chat-message author="system">Connected to cluster-a</strct-chat-message>
      <strct-chat-message author="user" name="Ada">Why is hv-02 slow?</strct-chat-message>
      <strct-chat-message
        author="assistant"
        name="Assistant"
        avatarIcon="sparkles"
        [streaming]="streaming()"
      >
        <p class="reply">Checking the host…</p>
        <div strctChatAttachment class="approval">Approve migration?</div>
      </strct-chat-message>
    </strct-chat-thread>
    <strct-chat-composer [(value)]="draft" (send)="sent.push($event)" placeholder="Ask…" />
  `,
})
class Host {
  busy = signal(false);
  streaming = signal(false);
  draft = signal('');
  sent: string[] = [];
}

function build() {
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement, host: fixture.componentInstance };
}

describe('StrctChatThread', () => {
  it('is a polite log, and shows the typing indicator only while busy', () => {
    const { fixture, el, host } = build();
    const thread = el.querySelector('strct-chat-thread') as HTMLElement;
    expect(thread.getAttribute('role')).toBe('log');
    expect(thread.getAttribute('aria-live')).toBe('polite');
    expect(thread.getAttribute('aria-label')).toBe('Assistant conversation');
    expect(el.querySelector('.strct-chat__typing')).toBeNull();

    host.busy.set(true);
    fixture.detectChanges();
    const typing = el.querySelector('.strct-chat__typing') as HTMLElement;
    expect(typing.getAttribute('role')).toBe('status');
    expect(typing.getAttribute('aria-label')).toBe('Assistant is typing');
    expect(typing.querySelectorAll('.strct-chat__dot').length).toBe(3);
    expect(thread.getAttribute('aria-busy')).toBe('true');
  });
});

describe('StrctChatMessage', () => {
  it('is an article named by its author, with the author on the host', () => {
    const { el } = build();
    const msgs = el.querySelectorAll('strct-chat-message');
    expect([...msgs].map((m) => m.getAttribute('data-author'))).toEqual([
      'system',
      'user',
      'assistant',
    ]);
    expect(msgs[1].getAttribute('role')).toBe('article');
    expect(msgs[1].getAttribute('aria-label')).toBe('Ada');
    // a system line is named as the system, not as the assistant
    expect(msgs[0].getAttribute('aria-label')).toBe('System');
    // a system line has no avatar and no name row
    expect(msgs[0].querySelector('strct-avatar')).toBeNull();
    expect(msgs[2].querySelector('strct-avatar')).toBeTruthy();
  });

  it('marks a streaming reply busy and shows the caret', () => {
    const { fixture, el, host } = build();
    const assistant = el.querySelectorAll('strct-chat-message')[2];
    expect(assistant.getAttribute('aria-busy')).toBeNull();
    expect(assistant.querySelector('.strct-msg__caret')).toBeNull();

    host.streaming.set(true);
    fixture.detectChanges();
    expect(assistant.getAttribute('aria-busy')).toBe('true');
    const caret = assistant.querySelector('.strct-msg__caret') as HTMLElement;
    expect(caret).toBeTruthy();
    expect(caret.getAttribute('aria-hidden')).toBe('true');
  });

  it('projects the content and an attachment card', () => {
    const { el } = build();
    const assistant = el.querySelectorAll('strct-chat-message')[2];
    expect(assistant.querySelector('.strct-msg__bubble .reply')?.textContent).toBe(
      'Checking the host…',
    );
    const card = assistant.querySelector('.approval') as HTMLElement;
    expect(card.classList).toContain('strct-chat__attachment');
    // the attachment sits outside the bubble, under it
    expect(card.closest('.strct-msg__bubble')).toBeNull();
  });
});

describe('StrctChatComposer', () => {
  function type(el: HTMLElement, fixture: ReturnType<typeof build>['fixture'], text: string) {
    const input = el.querySelector('textarea') as HTMLTextAreaElement;
    input.value = text;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    return input;
  }

  it('sends on Enter and keeps the draft two-way', () => {
    const { fixture, el, host } = build();
    const input = type(el, fixture, 'restart hv-02');
    expect(host.draft()).toBe('restart hv-02');
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(host.sent).toEqual(['restart hv-02']);
    expect(host.draft()).toBe('');
  });

  it('breaks a line on Shift+Enter, and never sends mid-composition', () => {
    const { fixture, el, host } = build();
    const input = type(el, fixture, 'first line');
    input.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true, bubbles: true }),
    );
    fixture.detectChanges();
    expect(host.sent).toEqual([]);

    input.dispatchEvent(new Event('compositionstart'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(host.sent).toEqual([]);

    input.dispatchEvent(new Event('compositionend'));
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(host.sent).toEqual(['first line']);
  });

  it('will not send an empty draft, and labels its controls', () => {
    const { fixture, el, host } = build();
    const send = el.querySelector('.strct-composer__send') as HTMLButtonElement;
    expect(send.disabled).toBe(true);
    expect(send.getAttribute('aria-label')).toBe('Send');
    type(el, fixture, '   ');
    expect(send.disabled).toBe(true);
    send.click();
    fixture.detectChanges();
    expect(host.sent).toEqual([]);

    const label = el.querySelector('.strct-composer__label') as HTMLLabelElement;
    const input = el.querySelector('textarea') as HTMLTextAreaElement;
    expect(label.getAttribute('for')).toBe(input.id);
  });
});
