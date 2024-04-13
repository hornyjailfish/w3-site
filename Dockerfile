FROM getmeili/meilisearch:latest

ENV MEILI_NO_ANALYTICS=true \
  MEILI_ENV='development' \
  MEILI_LOG_LEVEL='trace' \
  MEILI_MASTER_KEY='qQgG6IAVYFXCCNlGlspxLshCWdZagdYW_NajDrzbBoY' 

EXPOSE 7700:7700
VOLUME [ "/meili_data" ]
# ENTRYPOINT [ "meilisearch -p 7700" ]
