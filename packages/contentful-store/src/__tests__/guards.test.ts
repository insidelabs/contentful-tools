import { isAssetLink, isAssetLinkArray, isEntryLink, isEntryLinkArray } from '../guards';

describe('Type guards', () => {
    const assetLink = {
        sys: {
            type: 'Link',
            linkType: 'Asset',
            id: 'KUurOhebmj5G5WVBgqFEw',
        },
    };

    const entryLink = {
        sys: {
            type: 'Link',
            linkType: 'Entry',
            id: 'Ix9TWIHtIXK7fTXEu9hoO',
        },
    };

    describe('isAssetLink', () => {
        it('should validate an asset link', () => {
            expect(isAssetLink(assetLink)).toBe(true);
        });

        it('should reject an entry link', () => {
            expect(isAssetLink(entryLink)).toBe(false);
        });
    });

    describe('isAssetLinkArray', () => {
        it('should validate an array of asset links', () => {
            expect(isAssetLinkArray([assetLink])).toBe(true);
        });

        it('should reject an array of entry links', () => {
            expect(isAssetLinkArray([entryLink])).toBe(false);
        });
    });

    describe('isEntryLink', () => {
        it('should validate an entry link', () => {
            expect(isEntryLink(entryLink)).toBe(true);
        });

        it('should reject an asset link', () => {
            expect(isEntryLink(assetLink)).toBe(false);
        });
    });

    describe('isEntryLinkArray', () => {
        it('should validate an array of entry links', () => {
            expect(isEntryLinkArray([entryLink])).toBe(true);
        });

        it('should reject an array of asset links', () => {
            expect(isEntryLinkArray([assetLink])).toBe(false);
        });
    });
});
