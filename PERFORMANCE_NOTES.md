# Performance Optimizations for JavBus API

## Summary Fetching

Movie summaries are fetched from FANZA using the FanzaScraper implementation. To improve performance, summaries are now handled separately from movie details. The following optimizations have been implemented:

1. **Separated Summary Fetching**: Movie details and movie summaries are now separate API calls, allowing for more efficient data retrieval.

2. **API Routes Optimized**:
   - `/movies/:id` endpoint only returns movie detail information without summary
   - `/movies/:id/summary` dedicated endpoint for fetching only the movie summary
   - List and search endpoints (`/movies/` and `/movies/search`) never include summary data for better performance
   - `/movies/bulk-details` endpoint for fetching multiple movie details without summaries

## Usage Guidelines

1. **For movie listings and search results**:

   - Summary information is not included to improve performance
   - Use the regular endpoints: `/movies/` and `/movies/search`

2. **For movie details and summaries**:

   - For basic movie details: `/movies/ABC-123`
   - For movie summary: `/movies/ABC-123/summary`
   - Client applications should request summaries only when needed

3. **For bulk movie details**:

   ```
   POST /movies/bulk-details
   {
     "ids": ["ABC-123", "DEF-456", "GHI-789"]
   }
   ```

4. **For multiple summaries**:
   - Use multiple calls to the dedicated endpoint: `/movies/ABC-123/summary`
   - Consider implementing a batch endpoint for summaries if needed in the future

## Configuration

The FanzaScraper uses the `config/config.json` file to store mapping rules for different movie ID formats between JavBus and FANZA. This mapping is essential for successfully retrieving summaries from FANZA.

Example configuration:

```json
{
  "fanza_mappings": {
    "abw": "118abw",
    "ipx": "ipx",
    "ssni": "ssni"
  },
  "fanza_suffixes": {
    "stars": "00"
  }
}
```
