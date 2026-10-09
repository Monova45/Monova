import { describe, expect, it } from 'vitest';
import { absorbDamage, firewallRadius, matchResult } from './systems';
describe('Digital Drop match rules',()=>{
 it('absorbs damage in shield before health',()=>{expect(absorbDamage(100,10,25)).toEqual({hp:85,shield:0});expect(absorbDamage(5,0,20)).toEqual({hp:0,shield:0});});
 it('never closes the safe zone past eight meters',()=>{expect(firewallRadius(0)).toBe(48);expect(firewallRadius(1000)).toBe(8);});
 it('requires both eliminations and surviving the final closure',()=>{expect(matchResult(10,16,9)).toBeNull();expect(matchResult(10,15,8)).toBeNull();expect(matchResult(10,16,8)).toBe('win');expect(matchResult(0,16,8)).toBe('over');});
});
