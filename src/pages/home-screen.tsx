import { Button } from "@/components/base/buttons/button";

export const HomeScreen = () => {
    return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-8 px-4">
            <div className="flex flex-col items-center gap-3 text-center">
                <h1 className="text-display-sm font-semibold text-primary">Pa·Hoy</h1>
                <p className="max-w-sm text-md text-tertiary">
                    Conectando talento local con quienes necesitan sus servicios.
                </p>
            </div>

            <div className="flex flex-col items-center gap-4 w-full max-w-sm">
                <Button color="primary" size="xl" className="w-full">
                    Crear cuenta
                </Button>
                <Button color="secondary" size="xl" className="w-full">
                    Iniciar sesion
                </Button>
                <Button color="link-color" size="lg">
                    Explorar servicios
                </Button>
            </div>

            <div className="mt-4 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full bg-brand-solid" />
                    <span className="text-sm font-medium text-brand-secondary">Brand 600</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full bg-brand-solid_hover" />
                    <span className="text-sm font-medium text-secondary">Brand 700</span>
                </div>
                <div className="flex gap-1">
                    {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((shade) => (
                        <div
                            key={shade}
                            className="size-6 rounded-md"
                            style={{ backgroundColor: `var(--color-brand-${shade})` }}
                            title={`brand-${shade}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
