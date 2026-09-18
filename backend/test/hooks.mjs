export async function resolve(specifier, context, nextResolve) {
  if (specifier === '@prisma/client') {
    return nextResolve('./prisma-stub.mjs', {
      ...context,
      parentURL: import.meta.url,
    });
  }
  return nextResolve(specifier, context);
}
