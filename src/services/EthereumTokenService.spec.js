import EthereumTokenService from './EthereumTokenService';

test('getTokens returns tokens', (done) => {
  const ethereumTokenService = EthereumTokenService.buildTestService();
  ethereumTokenService.manager().connect()
    .then(() => {
      return ethereumTokenService.getTokens();
    })
    .then((tokens)=>{
    	expect(tokens.includes('DAI')).toBe(true);
    	expect(tokens.includes('MKR')).toBe(true);
    	done();
    });
});

test('getTokenVersions returns token versions', (done) => {
  const ethereumTokenService = EthereumTokenService.buildTestService();
  ethereumTokenService.manager().connect()
    .then(() => {
      return ethereumTokenService.getTokenVersions();
    })
    .then((tokenVersions)=>{
      expect(tokenVersions['MKR']).toEqual([1,2]); //why is this not passing?
      expect(tokenVersions['DAI']).toEqual([1]);
      done();
    });
});

test('getToken throws when given unknown token symbol', (done) => {
  const ethereumTokenService = EthereumTokenService.buildTestService();
  ethereumTokenService.manager().connect()
    .then(() => {
      expect(() => ethereumTokenService.getToken('XYZ')).toThrow();
      done();
    });
});