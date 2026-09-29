import { Directive } from '@angular/core';

/**
 * A description with markup in it, projected into `strct-checkbox`,
 * `strct-toggle` or `strct-radio` — where the string `description` renders, and
 * linked to the control the same way.
 *
 *   <strct-checkbox [(checked)]="net">
 *     Network
 *     <span strctControlDescription>The cluster networks and <strong>Windows Firewall</strong>.</span>
 *   </strct-checkbox>
 */
@Directive({ selector: '[strctControlDescription]' })
export class StrctControlDescription {}
