from django.conf import settings
from django.contrib.postgres.search import TrigramSimilarity


class LogicAdapte():

    def process(self, request, responses):
        raise NotImplementedError


class LevenshteinDistance():

    def process(self, request, statements):
        from Levenshtein import ratio

        best_similarity = settings.LOGIC_THRESHOLD
        best_statement = None
        for statement in statements:
            similarity = ratio(request, statement.request)

            if similarity > best_similarity:
                best_similarity = similarity
                best_statement = statement

        return best_statement


class PostgresTrigramSimilarity():

    def process(self, request, statements):
        ordered_responses = statements.annotate(similarity=TrigramSimilarity('request', request)) \
          .filter(similarity__gt=settings.LOGIC_THRESHOLD) \
          .order_by('-similarity')

        if ordered_responses:
            return ordered_responses.first()
        else:
            return None